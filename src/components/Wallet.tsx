import {useEffect, useRef, useState} from 'react'

export default function Wallet() {
    const sdkRef = usseRef<SocialLogin | null>(null);
    const [interval, enableInterval] = useState<boolean>(false);

    useEffect(() => {
        let configureLogin: NodeJS.Timeout | undefined;
        if (interval) {
            configureLogin = setInterval(() => {
                if (!!sdjRef.current?.provider) {
                    clearInterval(configureLogin);
                }
            }, 1000);
        }
    }, [interval]);
}
