import { MapContainer, Marker, Popup, TileLayer, Polyline } from "react-leaflet";
import { useState, useMemo, useEffect, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TourMapSection = ({ destination }) => {
    const [mapExpanded, setMapExpanded] = useState(false);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [routePath, setRoutePath] = useState([]);
    const [estimatedDistance, setEstimatedDistance] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    // Control body scroll khi mở fullscreen
    useEffect(() => {
        if (mapExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mapExpanded]);

    // Debounce function
    const useDebounce = (value, delay) => {
        const [debouncedValue, setDebouncedValue] = useState(value);

        useEffect(() => {
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            return () => {
                clearTimeout(handler);
            };
        }, [value, delay]);

        return debouncedValue;
    };

    const debouncedDestination = useDebounce(destination, 800);

    // Hàm lấy đường đi thực tế từ OSRM API
    const getRoutePath = useCallback(async (locations) => {
        if (locations.length < 2) {
            setEstimatedDistance(0);
            return [];
        }

        setCurrentStep(2);

        const maxPoints = 10;
        const optimizedLocations = locations.length > maxPoints
            ? [locations[0], ...locations.slice(-1)]
            : locations;

        const coordinates = optimizedLocations.map(loc => `${loc.lon},${loc.lat}`).join(';');

        try {
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=simplified&geometries=geojson`
            );

            if (!response.ok) throw new Error("OSRM API error");

            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                setEstimatedDistance(Math.round(route.distance / 1000));
                return route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
            }
        } catch (error) {
            console.warn("Không thể lấy đường đi từ OSRM, sử dụng đường thẳng");
        }

        // Fallback
        let totalDistance = 0;
        for (let i = 1; i < locations.length; i++) {
            const prev = locations[i-1];
            const curr = locations[i];
            totalDistance += L.latLng(prev.lat, prev.lon).distanceTo(L.latLng(curr.lat, curr.lon));
        }
        setEstimatedDistance(Math.round(totalDistance / 1000));

        return locations.map(loc => [loc.lat, loc.lon]);
    }, []);

    // Cache cho geocoding
    const geocodeCache = useMemo(() => new Map(), []);

    const geocodeLocation = async (locationName) => {
        const cacheKey = locationName.toLowerCase().trim();

        if (geocodeCache.has(cacheKey)) {
            return geocodeCache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName.trim() + ', Vietnam')}&limit=1`
            );

            if (!response.ok) throw new Error("Geocoding failed");

            const data = await response.json();

            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon)
                };

                geocodeCache.set(cacheKey, result);
                return result;
            }
        } catch (error) {
            console.warn(`Không thể lấy tọa độ: ${locationName}`);
        }

        return null;
    };

    useEffect(() => {
        const processDestination = async () => {
            if (!debouncedDestination) {
                setLocations([]);
                setRoutePath([]);
                setEstimatedDistance(0);
                setCurrentStep(0);
                return;
            }

            setLoading(true);
            setCurrentStep(1);

            try {
                const locationsArray = debouncedDestination
                    .split(/[,–—→>-]+/)
                    .map(item => item.trim())
                    .filter(item => item.length > 0);

                const maxLocations = 8;
                const limitedLocations = locationsArray.slice(0, maxLocations);

                const BATCH_SIZE = 3;
                const geocodedLocations = [];

                for (let i = 0; i < limitedLocations.length; i += BATCH_SIZE) {
                    const batch = limitedLocations.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(
                        batch.map(async (locationName, batchIndex) => {
                            const coords = await geocodeLocation(locationName);
                            if (coords) {
                                return {
                                    name: locationName,
                                    lat: coords.lat,
                                    lon: coords.lon,
                                    order: i + batchIndex
                                };
                            }
                            return null;
                        })
                    );

                    geocodedLocations.push(...batchResults.filter(loc => loc !== null));

                    if (i + BATCH_SIZE < limitedLocations.length) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }

                const validLocations = geocodedLocations.filter(loc => loc !== null);
                setLocations(validLocations);

                if (validLocations.length >= 2) {
                    const path = await getRoutePath(validLocations);
                    setRoutePath(path);
                } else {
                    setRoutePath([]);
                    setEstimatedDistance(0);
                }

                setCurrentStep(3);

            } catch (error) {
                console.error("Lỗi xử lý địa điểm:", error);
                setLocations([]);
                setRoutePath([]);
                setEstimatedDistance(0);
                setCurrentStep(0);
            } finally {
                setLoading(false);
            }
        };

        processDestination();
    }, [debouncedDestination, getRoutePath, geocodeCache]);

    const createCustomIcon = useCallback((order, total) => {
        let color = '#4ECDC4';
        if (order === 0) color = '#FF6B6B';
        if (order === total - 1) color = '#96CEB4';

        return new L.DivIcon({
            html: `
                <div style="
                    background-color: ${color};
                    width: ${total > 5 ? '28px' : '32px'};
                    height: ${total > 5 ? '28px' : '32px'};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 3px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: ${total > 5 ? '11px' : '13px'};
                ">
                    ${order === 0 ? '🏁' : order === total - 1 ? '🎯' : order + 1}
                </div>
            `,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
        });
    }, []);

    const { mapCenter, bounds } = useMemo(() => {
        const positions = locations.map(loc => [loc.lat, loc.lon]);

        if (positions.length === 0) {
            return {
                mapCenter: [16.047079, 108.206230],
                bounds: null
            };
        }

        const bounds = L.latLngBounds(positions);
        bounds.pad(0.1);

        return {
            mapCenter: bounds.getCenter(),
            bounds: bounds
        };
    }, [locations]);

    const hasMultipleLocations = locations.length > 1;

    // Component Loading với progress steps
    const LoadingWithSteps = () => (
        <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center max-w-md mx-auto">
                <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl">🗺️</span>
                    </div>

                    <div className="flex justify-between items-center mb-2 px-4">
                        <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                        <div className={`w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 px-2">
                        <span>Đang xác định<br />địa điểm</span>
                        <span>Đang tính toán<br />đường đi</span>
                        <span>Hoàn tất</span>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-800 text-lg mb-2">
                    {currentStep === 1 && "📡 Đang xác định vị trí các địa điểm..."}
                    {currentStep === 2 && "🛣️ Đang tính toán đường đi tối ưu..."}
                    {currentStep === 3 && "✅ Đã sẵn sàng!"}
                </h3>

                <p className="text-gray-600 mb-4">
                    {currentStep === 1 && "Hệ thống đang xác định tọa độ chính xác của các điểm đến"}
                    {currentStep === 2 && "Đang tìm đường đi ngắn nhất và đẹp nhất cho bạn"}
                    {currentStep === 3 && "Bản đồ hành trình đã sẵn sàng!"}
                </p>

                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-500"
                        style={{
                            width: currentStep === 1 ? '33%' :
                                currentStep === 2 ? '66%' :
                                    currentStep === 3 ? '100%' : '0%'
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );

    // Empty state đẹp hơn
    const EmptyState = () => (
        <div className="h-[300px] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🌏</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Hành Trình Của Bạn</h3>
                <p className="text-gray-600 mb-4 max-w-sm">
                    Nhập các điểm đến để xem bản đồ hành trình chi tiết với đường đi tối ưu
                </p>
                <div className="flex justify-center gap-2 text-sm text-gray-500">
                    <span className="bg-white px-3 py-1 rounded-full shadow-sm">Đà Nẵng</span>
                    <span className="bg-white px-3 py-1 rounded-full shadow-sm">Hội An</span>
                    <span className="bg-white px-3 py-1 rounded-full shadow-sm">Huế</span>
                </div>
            </div>
        </div>
    );

    // Fullscreen Map Component với overlay
    const FullscreenMap = () => (
        <div className="fixed inset-0 z-50 bg-white">
            {/* Header controls */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 z-50 p-4 shadow-lg">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">🗺️</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-xl">Bản Đồ Hành Trình</h2>
                            <p className="text-red-100 text-sm">
                                {locations.length > 0 ? `${locations.length} điểm đến • ${estimatedDistance}km` : 'Đang tải...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {locations.length > 0 && (
                            <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                                <span className="text-white font-medium">
                                    {locations.length} điểm • {estimatedDistance}km
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => setMapExpanded(false)}
                            className="bg-white text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                        >
                            ✕ Đóng Bản Đồ
                        </button>
                    </div>
                </div>
            </div>

            {/* Map container */}
            <div className="pt-20 h-full">
                {loading ? (
                    <LoadingWithSteps />
                ) : locations.length === 0 ? (
                    <EmptyState />
                ) : (
                    <MapContainer
                        center={mapCenter}
                        zoom={hasMultipleLocations ? 8 : 10}
                        scrollWheelZoom={true}
                        className="h-full w-full"
                        bounds={bounds}
                        boundsOptions={{ padding: [50, 50] }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        {routePath.length > 0 && (
                            <>
                                <Polyline
                                    positions={routePath}
                                    color="#FFFFFF"
                                    weight={8}
                                    opacity={0.3}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                                <Polyline
                                    positions={routePath}
                                    color="#FF0000"
                                    weight={6}
                                    opacity={0.8}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            </>
                        )}

                        {locations.map((location, index) => (
                            <Marker
                                key={`${location.lat}-${location.lon}-${index}`}
                                position={[location.lat, location.lon]}
                                icon={createCustomIcon(index, locations.length)}
                            >
                                <Popup className="custom-popup">
                                    <div className="text-center min-w-[200px] p-2">
                                        <div className="font-bold text-gray-800 text-lg mb-2 border-b pb-2">
                                            {location.name}
                                        </div>
                                        <div className="space-y-2">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                index === 0 ? 'bg-red-100 text-red-800 border border-red-200' :
                                                    index === locations.length - 1 ? 'bg-green-100 text-green-800 border border-green-200' :
                                                        'bg-blue-100 text-blue-800 border border-blue-200'
                                            }`}>
                                                {index === 0 ? '🚩 Điểm xuất phát' :
                                                    index === locations.length - 1 ? '🎯 Điểm kết thúc' :
                                                        `📍 Điểm thứ ${index + 1}`}
                                            </div>
                                            {index < locations.length - 1 && estimatedDistance > 0 && (
                                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                    Kế tiếp: {locations[index + 1].name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}
            </div>

            {/* Footer legend */}
            {locations.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-50">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-red-600 rounded"></div>
                            <span className="text-sm font-medium text-gray-700">Đường đi</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
                            <span className="text-sm text-gray-600">Điểm bắt đầu</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                            <span className="text-sm text-gray-600">Điểm kết thúc</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Normal Map View */}
            <div className="my-8 rounded-2xl shadow-lg overflow-hidden border border-gray-200 bg-white relative z-10">
                {/* Header cải tiến */}
                <div className="flex justify-between items-center bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <span className="text-white text-lg">🗺️</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-xl">Bản Đồ Hành Trình</h3>
                            <p className="text-red-100 text-sm">Xem lộ trình chi tiết và đường đi</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {locations.length > 0 && !loading && (
                            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                                <span className="text-white text-sm font-medium">
                                    {locations.length} điểm đến • {estimatedDistance}km
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => setMapExpanded(true)}
                            className="bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            🗺️ Mở Fullscreen
                        </button>
                    </div>
                </div>

                {/* Nội dung bản đồ bình thường */}
                {loading ? (
                    <LoadingWithSteps />
                ) : locations.length === 0 ? (
                    <EmptyState />
                ) : (
                    <MapContainer
                        center={mapCenter}
                        zoom={hasMultipleLocations ? 8 : 10}
                        scrollWheelZoom={true}
                        className="h-[400px] w-full"
                        bounds={bounds}
                        boundsOptions={{ padding: [20, 20] }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />

                        {routePath.length > 0 && (
                            <>
                                <Polyline
                                    positions={routePath}
                                    color="#FFFFFF"
                                    weight={8}
                                    opacity={0.3}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                                <Polyline
                                    positions={routePath}
                                    color="#FF0000"
                                    weight={6}
                                    opacity={0.8}
                                    lineCap="round"
                                    lineJoin="round"
                                />
                            </>
                        )}

                        {locations.map((location, index) => (
                            <Marker
                                key={`${location.lat}-${location.lon}-${index}`}
                                position={[location.lat, location.lon]}
                                icon={createCustomIcon(index, locations.length)}
                            >
                                <Popup className="custom-popup">
                                    <div className="text-center min-w-[200px] p-2">
                                        <div className="font-bold text-gray-800 text-lg mb-2 border-b pb-2">
                                            {location.name}
                                        </div>
                                        <div className="space-y-2">
                                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                index === 0 ? 'bg-red-100 text-red-800 border border-red-200' :
                                                    index === locations.length - 1 ? 'bg-green-100 text-green-800 border border-green-200' :
                                                        'bg-blue-100 text-blue-800 border border-blue-200'
                                            }`}>
                                                {index === 0 ? '🚩 Điểm xuất phát' :
                                                    index === locations.length - 1 ? '🎯 Điểm kết thúc' :
                                                        `📍 Điểm thứ ${index + 1}`}
                                            </div>
                                            {index < locations.length - 1 && estimatedDistance > 0 && (
                                                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                                    Kế tiếp: {locations[index + 1].name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                )}

                {/* Footer thông tin */}
                {(locations.length > 0 || loading) && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-6 items-center justify-between">
                            <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                                    <div className="w-3 h-1 bg-red-600 rounded"></div>
                                    <span className="text-sm font-medium text-gray-700">Đường đi</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                                    <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
                                    <span className="text-sm text-gray-600">Bắt đầu</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                                    <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                                    <span className="text-sm text-gray-600">Kết thúc</span>
                                </div>
                            </div>

                            {estimatedDistance > 0 && (
                                <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">Tổng quãng đường</div>
                                        <div className="font-bold text-gray-800 text-lg">{estimatedDistance} km</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {mapExpanded && <FullscreenMap />}
        </>
    );
};

export default TourMapSection;