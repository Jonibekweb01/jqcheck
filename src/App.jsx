import React, { useState, useEffect } from "react";
import { Users, Calendar, CheckCircle, XCircle, TrendingUp } from "lucide-react";

const groups = {
  "Group 1": ["Jakhongir", "Hasan", "Husan", "Javohir"],
  "Group 2": ["Abulaziz", "Moxirbek", "Mardon", "Anvar", "Joxa"],
};

const months = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
];

function App() {
  const BOT_TOKEN = "8373188257:AAG1hlsm1EXqXE6aYjx0txn0Lmfmpyzlq2o";
  const CHAT_ID = "@jqtechss";

  const [selectedGroup, setSelectedGroup] = useState("Group 1");
  const [attendance, setAttendance] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

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

  const sendTelegramMessage = (student, status, date) => {
    const message = `${student} ${date} darsga ${status}`;
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    }).catch((err) => console.error(err));
  };

  const toggleAttendance = (month, student, type) => {
    const today = new Date();
    const date = `${today.getDate()}.${today.getMonth() + 1}.${today.getFullYear()}`;

    setAttendance((prev) => {
      const monthData = prev[month] || {};
      const studentData = monthData[student] || { keldi: false, kemadi: false };

      const newData = {
        keldi: type === "keldi" ? !studentData.keldi : false,
        kemadi: type === "kemadi" ? !studentData.kemadi : false,
      };

      const statusMsg = newData.keldi ? "keldi" : newData.kemadi ? "kemadi" : "none";
      if (statusMsg !== "none") {
        sendTelegramMessage(student, statusMsg, date);
      }

      return { ...prev, [month]: { ...monthData, [student]: newData } };
    });
  };

  const getStats = () => {
    const monthData = attendance[months[currentMonth]] || {};
    const students = groups[selectedGroup];
    let present = 0, absent = 0;
    
    students.forEach(student => {
      if (monthData[student]?.keldi) present++;
      if (monthData[student]?.kemadi) absent++;
    });

    return { present, absent, total: students.length };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-indigo-600" size={36} />
            JQ Davomat Tizimi 
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Guruh
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                {Object.keys(groups).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Oy
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={20} />
                  <span className="text-sm font-medium">Statistika</span>
                </div>
                <div className="text-2xl font-bold">
                  {stats.present}/{stats.total}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Kelgan</p>
                <p className="text-3xl font-bold text-green-600">{stats.present}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Kelmagan</p>
                <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-full">
                <XCircle className="text-red-600" size={32} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Foiz</p>
                <p className="text-3xl font-bold text-indigo-600">
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="bg-indigo-100 p-4 rounded-full">
                <TrendingUp className="text-indigo-600" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">
              {selectedGroup} - {months[currentMonth]}
            </h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {groups[selectedGroup].map((student) => {
                const studentData = attendance[months[currentMonth]]?.[student];
                return (
                  <div
                    key={student}
                    className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-300 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {student.charAt(0)}
                      </div>
                      <span className="text-lg font-semibold text-gray-800">
                        {student}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                          studentData?.keldi
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-green-50"
                        }`}
                        onClick={() => toggleAttendance(months[currentMonth], student, "keldi")}
                      >
                        <CheckCircle size={20} />
                        Keldi
                      </button>

                      <button
                        className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
                          studentData?.kemadi
                            ? "bg-red-500 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-red-50"
                        }`}
                        onClick={() => toggleAttendance(months[currentMonth], student, "kemadi")}
                      >
                        <XCircle size={20} />
                        Kelmadi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;