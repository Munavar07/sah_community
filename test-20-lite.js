import { GoogleGenerativeAI } from "@google/generative-ai";
const ai = new GoogleGenerativeAI("AIzaSyC9sMYZyZeElq-1ZHEuIt5E6QucJx0ETP8");
async function run() {
  try {
    const response = await ai.getGenerativeModel({ model: "gemini-2.0-flash-lite" }).generateContent("test");
    console.log("SUCCESS:", response.response.text());
  } catch (e) { console.error("ERROR 2.0-lite:", e.message); }
}
run();
