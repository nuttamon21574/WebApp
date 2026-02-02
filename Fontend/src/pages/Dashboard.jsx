import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function BNPLDashboard() {

  const [data, setData] = useState({
    spay: null,
    lazpay: null,
  });

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const spaySnap = await getDoc(
        doc(db, "manualDebt", user.uid, "accounts", "spay")
      );

      const lazSnap = await getDoc(
        doc(db, "manualDebt", user.uid, "accounts", "lazpay")
      );

      setData({
        spay: spaySnap.exists() ? spaySnap.data() : null,
        lazpay: lazSnap.exists() ? lazSnap.data() : null,
      });
    };

    load();
  }, []);

  const handleManualSave = ({ type, data }) => {
    setData(prev => ({
      ...prev,
      [type]: data
    }));
  };

  return (
    <>
      {data.spay && <BNPLDetailRow label="SPayLater" data={data.spay} />}
      {data.lazpay && <BNPLDetailRow label="LazPayLater" data={data.lazpay} />}
    </>
  );
}
