import { PaymentCallbackHandler } from '../components/PaymentCallbackHandler/PaymentCallbackHandler';

export const PaymentCallbackHandlerScreen = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] -left-[5%] w-[350px] h-[350px] bg-purple-500/30 rounded-full blur-[100px]" />
                <div className="absolute top-[5%] -right-[5%] w-[400px] h-[400px] bg-yellow-200/40 rounded-full blur-[110px]" />
                <div className="absolute bottom-[20%] left-[30%] w-[300px] h-[300px] bg-blue-100/60 rounded-full blur-[90px]" />
            </div>

            <div className="flex absolute top-4 left-4 items-center gap-3">
                <img src="./aelilogo.svg" alt="logo" className="w-10 h-10 flex-shrink-0" />
                <span className="font-bold text-xl pacifico-regular">AELI Services</span>
            </div>
            <PaymentCallbackHandler />
        </div>
    );
};
