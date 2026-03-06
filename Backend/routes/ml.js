const express = require("express")
const router = express.Router()
const admin = require("firebase-admin")

const db = admin.firestore()

const { runRiskModel } = require("../services/mlService")

router.post("/risk-tier/:UID", async (req,res)=>{

    try{

    const uid = req.params.UID

    const doc = await db.collection("users").doc(uid).get()

    if(!doc.exists){
    return res.status(404).json({
        success:false,
        message:"User not found"
    })
    }

    const userData = doc.data()


        const modelInput = {
            installment_to_income: userData.installment_to_income,
            credit_utilization: userData.credit_utilization,
            platform_count: userData.platform_count,
            spaylater_missed_installments: userData.spaylater_missed_installments,
            lazpaylater_missed_installments: userData.lazpaylater_missed_installments
        }


        const result = await runRiskModel(modelInput)

        await db.collection("users").doc(uid).update({
            risk_tier: result.risk_tier
        })


        res.json({
            success:true,
            UID:uid,
            model_input: modelInput,
            risk_tier: result.risk_tier
        })

    }catch(error){

        console.error(error)

        res.status(500).json({
            success:false,
            message:"Prediction failed"
        })

    }

})

module.exports = router