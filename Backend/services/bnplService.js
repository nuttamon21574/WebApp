import { parse, isValid } from "date-fns";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

async function saveOrUpdateBNPL(uid, contracts, db) {
  const dbRef = collection(db, "bnplDebt", uid, "items");

  for (const contract of contracts) {
    const provider = contract.provider || "SpayLater";
    const uniqueKey = `${provider}_${contract.productName}_${contract.purchaseDate}`;

    const q = query(dbRef, where("uniqueKey", "==", uniqueKey));
    const snapshot = await getDocs(q);

    let docRef; // ✅ FIX: ให้ใช้ได้ทั้ง create/update

    if (!snapshot.empty) {
      // =========================
      // 🔄 UPDATE
      // =========================
      const docSnap = snapshot.docs[0];
      const oldData = docSnap.data();

      docRef = docSnap.ref;

      console.log("♻️ FOUND EXISTING:", uniqueKey);

      const oldDate = parse(oldData.dueDate, "dd/MM/yyyy", new Date());
      const newDate = parse(contract.dueDate, "dd/MM/yyyy", new Date());

      const finalDueDate =
        isValid(newDate) && isValid(oldDate) && newDate > oldDate
          ? contract.dueDate
          : oldData.dueDate;

      await updateDoc(docRef, {
        ...oldData,

        outstandingDebt:
          Number(contract.outstandingDebt) || oldData.outstandingDebt,
        monthlyInstallment:
          Number(contract.monthlyInstallment) || oldData.monthlyInstallment,
        totalInstallments:
          Number(contract.totalInstallments) || oldData.totalInstallments,
        annualInterestRate:
          Number(contract.annualInterestRate) || oldData.annualInterestRate,

        dueDate: finalDueDate,

        updatedAt: serverTimestamp()
      });
    } else {
      // =========================
      // 🆕 CREATE
      // =========================
      console.log("💾 NEW RECORD:", uniqueKey);

      docRef = await addDoc(dbRef, {
        productName: contract.productName || "-",
        purchaseDate: contract.purchaseDate || "",
        dueDate: contract.dueDate || "",

        totalDebt: Number(contract.totalDebt) || 0,
        outstandingDebt: Number(contract.outstandingDebt) || 0,
        monthlyInstallment: Number(contract.monthlyInstallment) || 0,
        totalInstallments: Number(contract.totalInstallments) || 0,
        annualInterestRate: Number(contract.annualInterestRate) || 0,

        provider,
        uniqueKey,

        createdAt: serverTimestamp()
      });
    }

    // =========================
    // 🔥 CALL BACKEND (FIXED)
    // =========================
    await fetch("http://localhost:5000/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid,
        itemId: docRef.id, // ✅ ใช้ได้ทั้ง create/update
      }),
    });
  }
}