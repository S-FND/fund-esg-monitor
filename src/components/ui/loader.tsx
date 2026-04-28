import { useEffect, useRef, useState } from "react";

export default function Loader({ show, text = "Loading..." }) {
    //show, text = "Loading...",progress = 60
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (show) {
            setVisible(true);
            setProgress(0);

            intervalRef.current = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 80) return prev;
                    return prev + (80 - prev) * 0.1; // smooth easing
                });
            }, 300);
        } else {
            // complete to 100%
            clearInterval(intervalRef.current);

            setProgress(100);

            // wait a bit before hiding (smooth UX)
            setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 400);
        }

        return () => clearInterval(intervalRef.current);
    }, [show]);

    if (!visible) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-transparent">
                <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

            <div className="relative flex flex-col items-center gap-3">

                <div className="w-12 h-12 border-4 border-white/30 border-t-blue-500 rounded-full animate-spin"></div>

                <p className="text-white text-lg tracking-wide">
                    {text}
                </p>

            </div>
        </div>
    );
    // return (
    //     <div className="fixed inset-0 z-50 pointer-events-none">

    //       <div className="absolute top-0 left-0 w-full h-1 bg-transparent">
    //         <div
    //           className="h-full bg-blue-500 transition-all duration-300"
    //           style={{ width: `${progress}%` }}
    //         />
    //       </div>

    //       <div className="flex items-center justify-center h-full">
    //         <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    //       </div>

    //     </div>
    //   );
}