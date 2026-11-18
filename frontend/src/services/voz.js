// Lee un texto en voz alta. Usa Azure Speech (voz neural peruana) si hay
// credenciales configuradas; si no, o si Azure falla (red, cuota), cae a
// la voz nativa del navegador -- asi el saludo nunca se queda mudo.
let sdkPromise = null

function hayAzureSpeech() {
  return Boolean(import.meta.env.VITE_AZURE_SPEECH_KEY && import.meta.env.VITE_AZURE_SPEECH_REGION)
}

async function hablarAzure(texto) {
  const sdk = await (sdkPromise ??= import('microsoft-cognitiveservices-speech-sdk'))
  const speechConfig = sdk.SpeechConfig.fromSubscription(import.meta.env.VITE_AZURE_SPEECH_KEY, import.meta.env.VITE_AZURE_SPEECH_REGION)
  speechConfig.speechSynthesisVoiceName = import.meta.env.VITE_AZURE_SPEECH_VOICE || 'es-PE-CamilaNeural'
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig)
  await new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(texto, (result) => { synthesizer.close(); resolve(result) }, (err) => { synthesizer.close(); reject(new Error(err)) })
  })
}

function hablarNativo(texto) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(texto)
  utter.lang = 'es-PE'
  window.speechSynthesis.speak(utter)
}

export async function hablar(texto) {
  if (hayAzureSpeech()) {
    try {
      await hablarAzure(texto)
      return
    } catch {
      // sigue abajo con la voz nativa
    }
  }
  hablarNativo(texto)
}
