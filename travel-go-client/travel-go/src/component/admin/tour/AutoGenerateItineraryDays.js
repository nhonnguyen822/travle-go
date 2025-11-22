import { useEffect } from "react";
import { useFormikContext } from "formik";

const AutoGenerateItineraryDays = () => {
    const { values, setFieldValue } = useFormikContext();

    useEffect(() => {
        const duration = parseInt(values.duration);
        if (!duration || duration <= 0) return;

        const currentDays = values.itineraryDays || [];

        if (currentDays.length > duration) {
            setFieldValue("itineraryDays", currentDays.slice(0, duration));
            return;
        }


        if (currentDays.length < duration) {
            const newDays = [...currentDays];
            for (let i = currentDays.length; i < duration; i++) {
                newDays.push({
                    title: `Ngày ${i + 1}`,
                    description: "",
                    activities: [
                        {
                            time: "",
                            title: "",
                            details: "",
                            imageFile: null,
                        },
                    ],
                });
            }
            setFieldValue("itineraryDays", newDays);
        }
    }, [values.duration, setFieldValue]);

    return null;
};

export default AutoGenerateItineraryDays;