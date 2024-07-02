import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  Platform
} from 'react-native'
import { useCentral, usePeripheral } from '../../src/index'
import NfcManager, {NfcTech, NfcEvents, TagEvent, Ndef } from 'react-native-nfc-manager'

export default function Child() {
  const { central } = useCentral()
  const { peripheral } = usePeripheral()

  const [hasNfc, setHasNfc] = useState<boolean>(false)
  const [isCentral, setIsCentral] = React.useState<boolean>(false)
  const [isPeripheral, setIsPeripheral] = React.useState<boolean>(false)

  const asCentral = () => {
	  setIsCentral(true)
	  setIsPeripheral(false)
  }
  const asPeripheral = () => {
	  setIsPeripheral(true)
	  setIsCentral(false)
  }

  useEffect(() => {
	  console.log('Start central or peripheral')
	  
	  const start = async () => {
		  if (isCentral) {
			  await central.start()
		  } else if (isPeripheral) {
			  await peripheral.start()
		  }
	  }

	  start()
  }, [isCentral, isPeripheral])

  useEffect(() => {
	console.log('Start NFC & Bluetooth connection')

	const requestPermissions = async () => {
	  await PermissionsAndroid.requestMultiple([
		'android.permission.ACCESS_FINE_LOCATION',
		'android.permission.BLUETOOTH_CONNECT',
		'android.permission.BLUETOOTH_SCAN',
		'android.permission.BLUETOOTH_ADVERTISE',
		'android.permission.ACCESS_COARSE_LOCATION',
	  ])
	}

	const checkIfNfcIsSupported = async () => {
		setHasNfc(await NfcManager.isSupported())
	}

	const startNfc = async () => {
		await NfcManager.start()

		NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: TagEvent) => {
			console.log('Tag Discovered', tag);

			await NfcManager.requestTechnology(NfcTech.Ndef)

			if (isPeripheral) {
				const bytes = Ndef.encodeMessage([Ndef.textRecord(await peripheral.getPeripheralAddress())])

				if (bytes) {
					await NfcManager.ndefHandler.writeNdefMessage(bytes)
				}
			} else if (isCentral) {
				const receivedTag = await NfcManager.getTag()

				if (receivedTag) {
					const decodedMessages = receivedTag.ndefMessage.map(record => Ndef.text.decodePayload(record.payload as unknown as Uint8Array))

					if (decodedMessages.length > 0) {
						const peripheralId = decodedMessages[0]

						console.log(`Received message: ${peripheralId}`)

						await central.fastConnect(peripheralId)

						console.log('Connected to peripheral.')
					}
				}
			}

			await NfcManager.cancelTechnologyRequest()
			await NfcManager.unregisterTagEvent()
		});
	}

	const stopNfc = async () => {
		NfcManager.setEventListener(NfcEvents.DiscoverTag, null)

		if (await NfcManager.isEnabled()) {
			await NfcManager.unregisterTagEvent()
		}
	}

	checkIfNfcIsSupported()

	if (hasNfc) {
		requestPermissions()
		startNfc()
	}

	return () => {
		if (hasNfc) {
			stopNfc()
		}
	}
  }, [isCentral, isPeripheral])

  if (hasNfc) {
	  return (
		<View style={styles.container}> 
			<Button title="Use central" onPress={asCentral} />
			<Button title="Use peripheral" onPress={asPeripheral} />
		</View>
	  )
  }

  return (
	  <Text>NFC is not supported by this device.</Text>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20
  }
})
