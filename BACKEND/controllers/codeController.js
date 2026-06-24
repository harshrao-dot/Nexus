const axios = require("axios");

exports.runCode = async (req, res) => {
  try {
    const { source_code, language, stdin } = req.body;

    if (!source_code?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Code is required",
      });
    }

    const languageMap = {
      javascript: { language: "nodejs", versionIndex: "4" },
      java: { language: "java", versionIndex: "5" },
      python: { language: "python3", versionIndex: "4" },
      cpp: { language: "cpp17", versionIndex: "1" },
    };

    const selected = languageMap[language];

    if (!selected) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language",
      });
    }

    const response = await axios.post("https://api.jdoodle.com/v1/execute",
      {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: source_code,
        language: selected.language,
        versionIndex: selected.versionIndex,
        stdin: stdin || "",
      }
    );

    const output = response.data.output || "";

    if (
    output.includes("SyntaxError") ||
    output.includes("Compilation failed") ||
    output.includes("error:")
  ) {
    return res.status(400).json({
      success: false,
      message: `Compilation Error\n\n${output}`,
    });
  }

  if (
    output.includes("Exception") ||
    output.includes("ReferenceError") ||
    output.includes("TypeError") ||
    output.includes("Runtime Error")
  ) {
    return res.status(400).json({
      success: false,
      message: `Runtime Error\n\n${output}`,
    });
  }

  return res.status(200).json({
    success: true,
    output,
    cpuTime: response.data.cpuTime,
    memory: response.data.memory,
  });

  } catch (err) {
    console.log(err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: err.response?.data || err.message,
    });
  }
};