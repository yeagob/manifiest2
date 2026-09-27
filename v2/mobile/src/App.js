import { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform, Alert } from 'react-native'
import { loadIdentity, forgetIdentity } from './identity.js'
import { requestAccess } from './health'
import { pair, syncNow } from './sync.js'
import { enableBackgroundSync } from './background.js'

const C = { paper: '#F4EFE6', ink: '#1D1B2F', pink: '#FF48B0', yellow: '#FFE800', blue: '#0078BF' }

function Button({ label, onPress, color = C.yellow, textColor = C.ink, disabled }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.btn, { backgroundColor: color, opacity: disabled ? 0.5 : 1, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
      <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
    </Pressable>
  )
}

export default function App() {
  const [identity, setIdentity] = useState(undefined)
  const [server, setServer] = useState('https://')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => { loadIdentity().then(setIdentity) }, [])

  async function run(fn) {
    setBusy(true)
    setMessage(null)
    try { await fn() } catch (err) { setMessage(err.message) } finally { setBusy(false) }
  }

  const doPair = () => run(async () => {
    await requestAccess()
    const id = await pair({ server, code, name: Platform.OS === 'ios' ? 'iPhone + Apple Watch' : 'Android + Wear OS' })
    setIdentity(id)
    await enableBackgroundSync()
    const r = await syncNow(7)
    setMessage(`¡Emparejado! ${r.credited} pasos nuevos sumados.`)
  })

  const doSync = () => run(async () => {
    const r = await syncNow(7)
    setMessage(r.credited ? `+${r.credited} pasos sumados a tus causas` : 'Todo al día')
    setIdentity(await loadIdentity())
  })

  const unpair = () => Alert.alert('Desemparejar', 'Este móvil dejará de enviar pasos. También puedes revocarlo desde la web.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Desemparejar', style: 'destructive', onPress: async () => { await forgetIdentity(); setIdentity(null) } }
  ])

  if (identity === undefined) return <SafeAreaView style={styles.root}><ActivityIndicator /></SafeAreaView>

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>MANIFIEST</Text>
        <Text style={styles.body}>
          {Platform.OS === 'ios' ? 'Lee los pasos de tu iPhone y Apple Watch desde Apple Salud.' : 'Lee los pasos de tu reloj Wear OS, Samsung, Garmin y otros a través de Health Connect.'}
          {' '}Solo el total diario. Nunca ubicación.
        </Text>
        {identity ? (
          <>
            <Text style={styles.body}>Servidor: {identity.server}</Text>
            <Text style={styles.body}>Última sincronización: {identity.lastSyncAt ? new Date(identity.lastSyncAt).toLocaleString() : 'nunca'}</Text>
            <Button label="Sincronizar ahora" onPress={doSync} color={C.pink} textColor="#fff" disabled={busy} />
            <Button label="Desemparejar" onPress={unpair} color="transparent" disabled={busy} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Servidor</Text>
            <TextInput style={styles.input} value={server} onChangeText={setServer} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
            <Text style={styles.label}>Código de emparejamiento (web → Relojes)</Text>
            <TextInput style={[styles.input, styles.code]} value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={8} />
            <Button label="Emparejar" onPress={doPair} color={C.pink} textColor="#fff" disabled={busy || code.length !== 8} />
          </>
        )}
        {busy && <ActivityIndicator color={C.ink} />}
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.paper, justifyContent: 'center', padding: 16 },
  card: { backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: C.ink, borderRadius: 14, padding: 20, gap: 12, shadowColor: C.ink, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 },
  title: { fontSize: 36, fontWeight: '900', color: C.ink, letterSpacing: 1 },
  body: { fontSize: 16, color: C.ink },
  label: { fontSize: 14, fontWeight: '700', color: C.ink },
  input: { borderWidth: 2, borderColor: C.ink, borderRadius: 10, padding: 12, fontSize: 16, color: C.ink, backgroundColor: '#fff' },
  code: { fontSize: 28, letterSpacing: 6, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  btn: { borderWidth: 2, borderColor: C.ink, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontSize: 17, fontWeight: '800' },
  message: { fontSize: 15, fontWeight: '700', color: C.blue }
})
