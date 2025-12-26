// hooks/useSubscriptionStatus.js
import { useState, useEffect } from "react";
import gtcfxApi from "../services/gtcfxApi";
import api from "../services/api";
import { useGTCFxAuth } from "../contexts/GTCFxAuthContext";

export const useSubscriptionStatus = () => {
    const { gtcAuthenticated, gtcLoading } = useGTCFxAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pammUuid, setPammUuid] = useState(null);
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);

    const checkSubscription = async () => {
        if (!gtcAuthenticated) {
            setIsSubscribed(false);
            setSubscriptionDetails(null);
            return;
        }

        setLoading(true);
        try {
            // Get system PAMM UUID from public endpoint (no admin required)
            const configRes = await api.get("/system/public/pamm-config");
            const uuid = configRes.data?.data?.pammUuid;

            if (!uuid) {
                setIsSubscribed(false);
                setPammUuid(null);
                setSubscriptionDetails(null);
                return;
            }

            setPammUuid(uuid);

            // Check subscription list using gtcfxApi
            const subsRes = await gtcfxApi.post("/subscribe_list", {
                page: 1,
                page_size: 100,
            });

            if (subsRes.data.code === 200 && subsRes.data.data?.list) {
                const activeSubscription = subsRes.data.data.list.find(
                    (sub) => sub.uuid === uuid && sub.status === 1
                );

                if (activeSubscription) {
                    setIsSubscribed(true);
                    setSubscriptionDetails(activeSubscription);
                } else {
                    setIsSubscribed(false);
                    setSubscriptionDetails(null);
                }
            } else {
                setIsSubscribed(false);
                setSubscriptionDetails(null);
            }
        } catch (error) {
            console.error("Error checking subscription:", error);
            setIsSubscribed(false);
            setSubscriptionDetails(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkSubscription();
    }, [gtcAuthenticated]);

    return {
        isSubscribed,
        loading: loading || gtcLoading,
        pammUuid,
        subscriptionDetails,
        refreshStatus: checkSubscription,
    };
};
