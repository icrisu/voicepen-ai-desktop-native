import React from 'react';

interface Props {
    children?: React.ReactNode,
    cssClasses?: string
}

export default function MainBackground({ children, cssClasses }: Props) {
    return (
        <div className={`relative min-h-[calc(100vh-0px)] w-full bg-slate-50 overflow-hidden ${cssClasses}`}>

            {/* Apply the class to a background layer */}
            <div className="subtle-grid-bg absolute inset-0 z-0"></div>

            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-70"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-pink-100 rounded-full mix-blend-multiply filter blur-[120px] opacity-80"></div>
            <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-blue-100 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>

            <div className="relative z-10">
                {children}
            </div>

        </div>
    )
}