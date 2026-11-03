
export function setupRoverControls() {
  const keys = {}

  function handleKeyDown(event) {
    keys[event.key.toLowerCase()] = true
  }

  function handleKeyUp(event) {
    keys[event.key.toLowerCase()] = false
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  return {
    keys,

    cleanup() {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }
}
