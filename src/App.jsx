import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Send,
  DollarSign,
  Bell,
  AlertTriangle,
} from "lucide-react";

const groups = {
  "Guruh": ["Jakhongir", "Hasan", "Husan", "Javohir", "Abulaziz", "Moxirbek", "Mardon", "Anvar", "Joxa"],
};

const parentContacts = {
  "Jakhongir": "258786414",
  "Hasan": "987654321",
  "Husan": "555666777",
  "Javohir": "111222333",
  "Abulaziz": "444555666",
  "Moxirbek": "777888999",
  "Mardon": "222333444",
  "Anvar": "888999000",
  "Joxa": "333444555",
};

const months = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

function App() {
  const BOT_TOKEN = "8373188257:AAG1hlsm1EXqXE6aYjx0txn0Lmfmpyzlq2o";
  const CHAT_ID = "@jqtechss";

  const [selectedGroup, setSelectedGroup] = useState("Guruh");
  const [attendance, setAttendance] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentDay, setCurrentDay] = useState(new Date().getDate());
  const [isSending, setIsSending] = useState(false);
  
  // To'lov tizimi uchun state
  const [paymentDates, setPaymentDates] = useState({});
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const getDaysInMonth = (month) => {
    const year = new Date().getFullYear();
    return new Date(year, month + 1, 0).getDate();
  };

  const getAvailableDays = () => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(currentMonth);
    const currentMonthIndex = today.getMonth();
    
    if (currentMonth === currentMonthIndex) {
      return today.getDate();
    } else if (currentMonth < currentMonthIndex) {
      return daysInMonth;
    }
    return 0;
  };

  useEffect(() => {
    const saved = localStorage.getItem("attendanceData");
    if (saved) {
      try {
        setAttendance(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading data:", e);
      }
    }

    const savedPayments = localStorage.getItem("paymentDates");
    if (savedPayments) {
      try {
        setPaymentDates(JSON.parse(savedPayments));
      } catch (e) {
        console.error("Error loading payment data:", e);
      }
    }
  }, []);

  useEffect(() => {
    const maxDay = getAvailableDays();
    if (maxDay > 0) {
      setCurrentDay(Math.min(currentDay, maxDay));
    }
  }, [currentMonth]);

  useEffect(() => {
    if (Object.keys(attendance).length > 0) {
      localStorage.setItem("attendanceData", JSON.stringify(attendance));
    }
  }, [attendance]);

  useEffect(() => {
    if (Object.keys(paymentDates).length > 0) {
      localStorage.setItem("paymentDates", JSON.stringify(paymentDates));
    }
  }, [paymentDates]);

  const setPaymentDate = (student, day) => {
    setPaymentDates(prev => ({
      ...prev,
      [student]: day
    }));
  };

  const getPaymentStatus = (student) => {
    const today = new Date().getDate();
    const paymentDay = paymentDates[student];
    
    if (!paymentDay) return { status: "not-set", message: "To'lov sanasi belgilanmagan", color: "gray" };
    
    const daysUntil = paymentDay - today;
    
    if (daysUntil === 3) {
      return { status: "warning-3", message: `💰 3 kundan keyin (${paymentDay}-${months[currentMonth]}) to'lov kuni!`, color: "yellow" };
    } else if (daysUntil === 2) {
      return { status: "warning-2", message: `💰 2 kundan keyin (${paymentDay}-${months[currentMonth]}) to'lov kuni!`, color: "yellow" };
    } else if (daysUntil === 1) {
      return { status: "warning-1", message: `💰 MUHIM: Ertaga (${paymentDay}-${months[currentMonth]}) to'lov kuni!`, color: "orange" };
    } else if (daysUntil === 0) {
      return { status: "today", message: `💰 BUGUN TO'LOV KUNI!`, color: "blue" };
    } else if (daysUntil < 0) {
      return { status: "overdue", message: `⚠️ DIQQAT: To'lov muddati ${Math.abs(daysUntil)} kun o'tib ketgan!`, color: "red" };
    } else {
      return { status: "ok", message: `✅ To'lov: ${paymentDay}-${months[currentMonth]}`, color: "green" };
    }
  };

  const sendPaymentReminders = async () => {
    setIsSendingReminders(true);
    const students = groups[selectedGroup];
    let sentCount = 0;

    try {
      for (const student of students) {
        const parentId = parentContacts[student];
        if (!parentId) continue;

        const paymentStatus = getPaymentStatus(student);
        
        // Faqat eslatma kerak bo'lgan statuslar uchun yuborish
        if (['warning-3', 'warning-2', 'warning-1', 'today', 'overdue'].includes(paymentStatus.status)) {
          const paymentDay = paymentDates[student];
          const today = new Date();
          const daysUntil = paymentDay - today.getDate();
          
          let message = `
👋 Assalomu alaykum!

👤 O'quvchi: ${student}
📅 Bugungi sana: ${today.getDate()}-${months[currentMonth]}-${today.getFullYear()}
💳 To'lov sanasi: ${paymentDay}-${months[currentMonth]}

${paymentStatus.message}

${paymentStatus.status === 'overdue' ? '🔒 To\'lov amalga oshirilmagunga qadar darslar muzlatiladi.\n' : ''}
💰 To'lov summasini o'z vaqtida to'lashingizni so'raymiz.

📚 JQ Tech Center
📞 Aloqa: @jqtechss
          `.trim();

          await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: parentId,
                text: message,
                parse_mode: "HTML",
              }),
            }
          );
          
          sentCount++;
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      alert(`✅ ${sentCount} ta eslatma yuborildi!`);
    } catch (err) {
      console.error(err);
      alert("❌ Xatolik yuz berdi!");
    } finally {
      setIsSendingReminders(false);
    }
  };

  const sendTelegramSummary = async () => {
    const today = new Date();
    const date = `${currentDay}.${currentMonth + 1}.${today.getFullYear()}`;
    const dateKey = `${months[currentMonth]}-${currentDay}`;
    const monthData = attendance[dateKey] || {};
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

    const channelMessage = `
📊 DAVOMAT HISOBOTI
━━━━━━━━━━━━━━━━━━
📅 Sana: ${date}
👥 Guruh: ${selectedGroup}
📆 Oy: ${months[currentMonth]}
🗓 Kun: ${currentDay}

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
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: channelMessage,
            parse_mode: "HTML",
          }),
        }
      );

      for (const student of students) {
        const parentId = parentContacts[student];
        if (!parentId) continue;

        const status = monthData[student]?.keldi ? "✅ KELDI" : 
                      monthData[student]?.kemadi ? "❌ KELMADI" : "❓ Belgilanmagan";
        
        const parentMessage = `
👋 Assalomu alaykum!

👤 O'quvchi: ${student}
📅 Sana: ${date}
📆 ${months[currentMonth]} oyining ${currentDay}-kuni

${status}

${monthData[student]?.keldi ? "✅ Farzandingiz bugun darsga keldi." : ""}
${monthData[student]?.kemadi ? "⚠️ Farzandingiz bugun darsga kelmadi." : ""}

📚 JQ Tech Center
        `.trim();

        await fetch(
          `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: parentId,
              text: parentMessage,
              parse_mode: "HTML",
            }),
          }
        );

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      alert("✅ Hisobotlar muvaffaqiyatli yuborildi!");
    } catch (err) {
      console.error(err);
      alert("❌ Xatolik yuz berdi!");
    } finally {
      setIsSending(false);
    }
  };

  const toggleAttendance = (month, day, student, type) => {
    const dateKey = `${month}-${day}`;
    setAttendance((prev) => {
      const dayData = prev[dateKey] || {};
      const studentData = dayData[student] || {
        keldi: false,
        kemadi: false,
      };

      const newData = {
        keldi: type === "keldi" ? !studentData.keldi : false,
        kemadi: type === "kemadi" ? !studentData.kemadi : false,
      };

      return {
        ...prev,
        [dateKey]: { ...dayData, [student]: newData },
      };
    });
  };

  const getStats = () => {
    const dateKey = `${months[currentMonth]}-${currentDay}`;
    const dayData = attendance[dateKey] || {};
    const students = groups[selectedGroup];
    let present = 0, absent = 0;

    students.forEach((student) => {
      if (dayData[student]?.keldi) present++;
      if (dayData[student]?.kemadi) absent++;
    });

    return { present, absent, total: students.length };
  };

  const getPaymentStats = () => {
    const students = groups[selectedGroup];
    let needReminder = 0;
    let overdue = 0;

    students.forEach(student => {
      const status = getPaymentStatus(student);
      if (['warning-3', 'warning-2', 'warning-1', 'today'].includes(status.status)) {
        needReminder++;
      }
      if (status.status === 'overdue') {
        overdue++;
      }
    });

    return { needReminder, overdue };
  };

  const stats = getStats();
  const paymentStats = getPaymentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                JQ Davomat va To'lov Tizimi
              </h1>
            </div>
            <button
              onClick={() => setShowPaymentPanel(!showPaymentPanel)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              {showPaymentPanel ? "Davomatga qaytish" : "To'lov paneli"}
            </button>
          </div>
        </div>

        {showPaymentPanel ? (
          /* TO'LOV PANELI */
          <>
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-800">To'lov Eslatma Tizimi</h2>
              </div>
              
              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-800 text-sm font-medium">Eslatma kerak</p>
                      <p className="text-3xl font-bold text-yellow-600">{paymentStats.needReminder}</p>
                    </div>
                    <Bell className="w-10 h-10 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-800 text-sm font-medium">Muddati o'tgan</p>
                      <p className="text-3xl font-bold text-red-600">{paymentStats.overdue}</p>
                    </div>
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Students Payment List */}
              <div className="space-y-3">
                {groups[selectedGroup].map((student) => {
                  const status = getPaymentStatus(student);
                  const bgColor = {
                    'gray': 'bg-gray-50',
                    'green': 'bg-green-50',
                    'yellow': 'bg-yellow-50',
                    'orange': 'bg-orange-50',
                    'blue': 'bg-blue-50',
                    'red': 'bg-red-50'
                  }[status.color];

                  const borderColor = {
                    'gray': 'border-gray-200',
                    'green': 'border-green-300',
                    'yellow': 'border-yellow-300',
                    'orange': 'border-orange-300',
                    'blue': 'border-blue-300',
                    'red': 'border-red-300'
                  }[status.color];

                  return (
                    <div key={student} className={`${bgColor} border-2 ${borderColor} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {student.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-800">{student}</span>
                        </div>
                        
                        <select
                          value={paymentDates[student] || ""}
                          onChange={(e) => setPaymentDate(student, Number(e.target.value))}
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="">Sanani tanlang</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}-kun</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="text-sm font-medium">
                        {status.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send Reminders Button */}
              <button
                onClick={sendPaymentReminders}
                disabled={isSendingReminders || paymentStats.needReminder === 0}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl"
              >
                <Bell className="w-5 h-5" />
                {isSendingReminders ? "Yuborilmoqda..." : `To'lov eslatmalarini yuborish (${paymentStats.needReminder + paymentStats.overdue})`}
              </button>
            </div>
          </>
        ) : (
          /* DAVOMAT PANELI */
          <>
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oy</label>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  >
                    {months.map((m, idx) => {
                      const today = new Date();
                      const isFutureMonth = idx > today.getMonth();
                      return (
                        <option key={idx} value={idx} disabled={isFutureMonth}>
                          {m} {isFutureMonth ? "(Kelgusi)" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kun</label>
                  <select
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    value={currentDay}
                    onChange={(e) => setCurrentDay(Number(e.target.value))}
                  >
                    {Array.from({ length: getAvailableDays() }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statistika</label>
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
                    <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Kelmagan</p>
                    <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-500" />
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
                  <TrendingUp className="w-12 h-12 text-indigo-500" />
                </div>
              </div>
            </div>

            {/* Student Table */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedGroup} - {months[currentMonth]} - {currentDay}-kun
                </h2>
              </div>

              <div className="space-y-3">
                {groups[selectedGroup].map((student) => {
                  const dateKey = `${months[currentMonth]}-${currentDay}`;
                  const studentData = attendance[dateKey]?.[student];
                  return (
                    <div
                      key={student}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {student.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-800">{student}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            studentData?.keldi
                              ? "bg-green-500 text-white shadow-lg"
                              : "bg-gray-200 text-gray-700 hover:bg-green-100"
                          }`}
                          onClick={() => toggleAttendance(months[currentMonth], currentDay, student, "keldi")}
                        >
                          Keldi
                        </button>
                        <button
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            studentData?.kemadi
                              ? "bg-red-500 text-white shadow-lg"
                              : "bg-gray-200 text-gray-700 hover:bg-red-100"
                          }`}
                          onClick={() => toggleAttendance(months[currentMonth], currentDay, student, "kemadi")}
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
                {isSending ? "Yuborilmoqda..." : "Kanalga va Ota-onalarga yuborish"}
              </button>
              <p className="text-center text-sm text-gray-600 mt-2">
                Kanal va {groups[selectedGroup].length} ta ota-onaga yuboriladi
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;