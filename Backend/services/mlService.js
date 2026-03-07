const { spawn } = require("child_process");
const path = require("path");

async function runRiskModel(input) {

  return new Promise((resolve, reject) => {

    const script = path.join(__dirname, "../ml/predict.py");

    const py = spawn("python", [
      script,
      JSON.stringify(input)
    ]);

    let output = "";

    py.stdout.on("data", (data) => {
      output += data.toString();
    });

    py.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    py.on("close", () => {
      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });

  });

}

module.exports = { runRiskModel };
