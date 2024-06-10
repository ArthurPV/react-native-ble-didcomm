import * as React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform
} from 'react-native'
// import { isBleEnabled } from '@animo-id/react-native-ble-didcomm'
import { useEffect, useState } from 'react'
import { Peripheral } from '@animo-id/react-native-ble-didcomm'
import { Agent } from '@credo-ts/core'
import { agentDependencies } from '@credo-ts/react-native'

export default function App() {
  const [peripheral, setPeripheral] = useState<Peripheral | undefined>(
    undefined
  )
  const [agent, setAgent] = useState<Agent | undefined>(undefined)

  const requestPermissions = async () => {
    await PermissionsAndroid.requestMultiple([
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_COARSE_LOCATION'
    ])
  }

  const startPeripheral = async () => {
    const p = new Peripheral()

    await p.start()
    setPeripheral(p)
  }

  const initAgent = async () => {
    const a = new Agent({
      config: {
        label: 'PC',
        autoUpdateStorageOnStartup: true
      },
      modules: {},
      dependencies: agentDependencies
    })

    await a.initialize()
    setAgent(a)
  }

  useEffect(() => {
    requestPermissions()
    startPeripheral()
    initAgent()
  }, [])

  return (
    <View>
      <Text>{peripheral && 'Peripheral is start'}</Text>
      <Text>{agent?.isInitialized && 'Agent is initialized'}</Text>
    </View>
  )
}
