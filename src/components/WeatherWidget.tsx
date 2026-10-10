import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets } from 'lucide-react';
import { Language } from '../translations';

interface WeatherWidgetProps {
    lat: number;
    lng: number;
    language: Language;
}

export default function WeatherWidget({ lat, lng, language }: WeatherWidgetProps) {
    const isKa = language === 'ka';
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!lat || !lng) return;
        setLoading(true);
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`)
            .then(res => res.json())
            .then(data => {
                if (data && data.daily) {
                    setForecast(data.daily);
                }
            })
            .catch(err => console.error("Weather fetch error:", err))
            .finally(() => setLoading(false));
    }, [lat, lng]);

    const getWeatherIcon = (code: number, className: string = "") => {
        // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
        if (code === 0) return <Sun className={`${className} text-yellow-400`} />;
        if (code >= 1 && code <= 3) return <Cloud className={`${className} text-gray-400`} />;
        if (code >= 51 && code <= 67) return <CloudRain className={`${className} text-blue-400`} />;
        if (code >= 71 && code <= 77) return <CloudSnow className={`${className} text-white`} />;
        if (code >= 80 && code <= 82) return <CloudRain className={`${className} text-blue-500`} />;
        if (code >= 85 && code <= 86) return <CloudSnow className={`${className} text-white`} />;
        if (code >= 95) return <CloudLightning className={`${className} text-purple-400`} />;
        return <Sun className={`${className} text-yellow-400`} />;
    };

    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isKa) {
            const days = ['კვ', 'ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა'];
            return days[date.getDay()];
        }
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    if (loading) {
        return (
            <div className="bg-[#131b1a] border border-[#1a2524] rounded-2xl p-4 animate-pulse h-32 w-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!forecast) return null;

    return (
        <div className="bg-[#131b1a] border border-[#1a2524] rounded-2xl p-4 text-white">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sun size={14} className="text-yellow-400" />
                {isKa ? '5 დღის ამინდი' : '5-Day Forecast'}
            </h4>
            <div className="flex justify-between items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {forecast.time.slice(0, 5).map((time: string, i: number) => (
                    <div key={time} className="flex flex-col items-center flex-1 min-w-[50px]">
                        <span className="text-[10px] font-bold text-gray-500 mb-1.5">{getDayName(time)}</span>
                        {getWeatherIcon(forecast.weathercode[i], "mb-1.5")}
                        <div className="flex gap-1.5 items-baseline">
                            <span className="text-[12px] font-extrabold">{Math.round(forecast.temperature_2m_max[i])}°</span>
                            <span className="text-[9px] font-medium text-gray-500">{Math.round(forecast.temperature_2m_min[i])}°</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
