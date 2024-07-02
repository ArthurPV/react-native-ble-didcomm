import * as React from 'react'
import { useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform
} from 'react-native'
import { isBleEnabled } from '../../src/bleStatus'
import { Central, Peripheral, PeripheralProvider, CentralProvider } from '../../src/index'
import NfcManager, {NfcTech, NfcEvents, TagEvent} from 'react-native-nfc-manager';
import Child from './Child'

export const Spacer = () => <View style={{ height: 20, width: 20 }} />

const requestPermissions = async () => {
  await PermissionsAndroid.requestMultiple([
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.BLUETOOTH_ADVERTISE',
    'android.permission.ACCESS_COARSE_LOCATION',
  ])
}

export default function App() {
  return (
	  <PeripheralProvider  peripheral={new Peripheral()}>
		  <CentralProvider central={new Central()}>
			  <Child />
		  </CentralProvider>
	  </PeripheralProvider>
  )
}
