
export function createMissionLogs() {
  const logs = []

  return {
    addLog(type, message, details = {}) {
      const entry = {
        id: logs.length + 1,
        type,
        message,
        details,
        time: new Date().toLocaleTimeString(),
      }

      logs.push(entry)

      console.log('SCOUT MISSION LOG:', entry)

      return entry
    },

    getLogs() {
      return [...logs]
    },

    clearLogs() {
      logs.length = 0
    },
  }
}
