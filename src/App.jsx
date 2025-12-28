import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Send,
} from "lucide-react";

const groups = {
  "Group 1": ["Jakhongir", "Hasan", "Husan", "Javohir"],
  "Group 2": ["Abulaziz", "Moxirbek", "Mardon", "Anvar", "Joxa"],
};

const months = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

function App() {
  const BOT_TOKEN = "8373188257:AAG1hlsm1EXqXE6aYjx0txn0Lmfmpyzlq2o";
  const CHAT_ID = "@jqtechss";

  const [selectedGroup, setSelectedGroup] = useState("Group 1");
  const [attendance, setAttendance] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [isSending, setIsSending] = useState(false);

  // Load from state on mount
  useEffect(() => {
    const saved = localStorage.getItem("attendanceData");
    if (saved) {
      try {
        setAttendance(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading data:", e);
      }
    }
  }, []);

  // Save to localStorage whenever attendance changes
  useEffect(() => {
    if (Object.keys(attendance).length > 0) {
      localStorage.setItem("attendanceData", JSON.stringify(attendance));
    }
  }, [attendance]);

  const sendTelegramSummary = async () => {
    const today = new Date();
    const date = `${today.getDate()}.${
      today.getMonth() + 1
    }.${today.getFullYear()}`;
    const monthData = attendance[months[currentMonth]] || {};
    const students = groups[selectedGroup];

    let presentList = [];
    let absentList = [];

    students.forEach((student) => {
      if (monthData[student]?.keldi) {
        presentList.push(student);
      } else if (monthData[student]?.kemadi) {
        absentList.push(student);
      }
    });

    const message = `
📊 DAVOMAT HISOBOTI
━━━━━━━━━━━━━━━━━━
📅 Sana: ${date}
👥 Guruh: ${selectedGroup}
📆 Oy: ${months[currentMonth]}

✅ KELGANLAR (${presentList.length}):
${presentList.length > 0 ? presentList.map((s) => `  • ${s}`).join("\n") : "  Hech kim kelmadi"}

❌ KELMAGANLAR (${absentList.length}):
${absentList.length > 0 ? absentList.map((s) => `  • ${s}`).join("\n") : "  Hammasi kelgan"}

📈 JAMI: ${students.length} ta o'quvchi
📊 Foiz: ${Math.round((presentList.length / students.length) * 100)}%
━━━━━━━━━━━━━━━━━━
    `.trim();

    setIsSending(true);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: "HTML",
          }),
        }
      );

      if (response.ok) {
        alert("✅ Hisobot muvaffaqiyatli yuborildi!");
      } else {
        alert("❌ Xatolik yuz berdi!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Xatolik yuz berdi!");
    } finally {
      setIsSending(false);
    }
  };

  const toggleAttendance = (month, student, type) => {
    setAttendance((prev) => {
      const monthData = prev[month] || {};
      const studentData = monthData[student] || {
        keldi: false,
        kemadi: false,
      };

      const newData = {
        keldi: type === "keldi" ? !studentData.keldi : false,
        kemadi: type === "kemadi" ? !studentData.kemadi : false,
      };

      return {
        ...prev,
        [month]: { ...monthData, [student]: newData },
      };
    });
  };

  const getStats = () => {
    const monthData = attendance[months[currentMonth]] || {};
    const students = groups[selectedGroup];
    let present = 0,
      absent = 0;

    students.forEach((student) => {
      if (monthData[student]?.keldi) present++;
      if (monthData[student]?.kemadi) absent++;
    });

    return { present, absent, total: students.length };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              JQ Davomat Tizimi
            </h1>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guruh
              </label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                {Object.keys(groups).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oy
              </label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statistika
              </label>
              <div className="p-3 bg-indigo-50 rounded-lg border-2 border-indigo-200 text-center font-semibold text-indigo-700">
                {stats.present}/{stats.total}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Kelgan</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.present}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Kelmagan</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.absent}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Foiz</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats.total > 0
                    ? Math.round((stats.present / stats.total) * 100)
                    : 0}
                  %
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedGroup} - {months[currentMonth]}
            </h2>
          </div>

          <div className="space-y-3">
            {groups[selectedGroup].map((student) => {
              const studentData =
                attendance[months[currentMonth]]?.[student];
              return (
                <div
                  key={student}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {student.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-800">
                      {student}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        studentData?.keldi
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-gray-200 text-gray-700 hover:bg-green-100"
                      }`}
                      onClick={() =>
                        toggleAttendance(
                          months[currentMonth],
                          student,
                          "keldi"
                        )
                      }
                    >
                      Keldi
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        studentData?.kemadi
                          ? "bg-red-500 text-white shadow-lg"
                          : "bg-gray-200 text-gray-700 hover:bg-red-100"
                      }`}
                      onClick={() =>
                        toggleAttendance(
                          months[currentMonth],
                          student,
                          "kemadi"
                        )
                      }
                    >
                      Kelmadi
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Send Button */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <button
            onClick={sendTelegramSummary}
            disabled={isSending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
            {isSending ? "Yuborilmoqda..." : "Telegram guruhga yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;