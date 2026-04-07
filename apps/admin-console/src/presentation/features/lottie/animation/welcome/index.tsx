"use client";

import Lottie from "lottie-react";
import animation from "images/logo/welcome.json";

const AnimationWelcome = () => {
    return (
        <div className="inline-flex items-center justify-center">
            <Lottie
                animationData={animation}
                loop={true}
                style={{ width: 40, height: 40 }}
            />
        </div>
    );
};
export default AnimationWelcome;