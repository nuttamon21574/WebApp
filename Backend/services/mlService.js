const { spawn } = require("child_process");
const path = require("path");

async function runRiskModel(input) {

  return new Promise((resolve, reject) => {

    // 🔥 เปลี่ยนจาก predict.py → run_predict.py
    const script = path.join(__dirname, "../ml/run_predict.py");

    const py = spawn("python", [
      script,
      JSON.stringify(input)
    ]);

    let output = "";
    let errorOutput = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

py.on("close", (code) => {

  console.log("🔥 RAW OUTPUT:", output)
  console.error("🔥 STDERR:", errorOutput)

  if (code !== 0) {
    return reject(new Error(errorOutput))
  }

  if (!output) {
    return reject(new Error("Python returned empty output"))
  }

  try {
    const parsed = JSON.parse(output)
    resolve(parsed)
  } catch (err) {
    reject(new Error("Invalid JSON from Python: " + output))
  }

})

  });

}

module.exports = { runRiskModel };