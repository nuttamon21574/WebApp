const { spawn } = require("child_process")
const path = require("path")

function runRiskModel(data){

    return new Promise((resolve,reject)=>{

        const script = path.join(__dirname,"../ml/predict.py")

        const py = spawn("python",[script, JSON.stringify(data)])

        let output = ""

        py.stdout.on("data",(data)=>{
            output += data.toString()
        })

        py.stderr.on("data",(err)=>{
            console.error(err.toString())
        })

        py.on("close",()=>{
            resolve(JSON.parse(output))
        })

    })

}

module.exports = { runRiskModel }