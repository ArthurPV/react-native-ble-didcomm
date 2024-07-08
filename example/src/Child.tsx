import * as React from 'react'
import BackgroundService from 'react-native-background-actions';
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
	console.log('Start NFC & Bluetooth connection')

  const startCentralOrPeripheral = async () => {
	  if (isCentral) {
		  console.log('Start central')
		  await central.start()
	  } else if (isPeripheral) {
		  console.log('Start peripheral')
		  await peripheral.start()
	  }
  }

	const requestPermissions = async () => {
	  await PermissionsAndroid.requestMultiple([
		'android.permission.ACCESS_FINE_LOCATION',
		'android.permission.BLUETOOTH_CONNECT',
		'android.permission.BLUETOOTH_SCAN',
		'android.permission.BLUETOOTH_ADVERTISE',
		'android.permission.ACCESS_COARSE_LOCATION',
	  ])
	}

	const startNfc = async () => {	
		await NfcManager.start()
		setHasNfc(true)

		console.log('Nfc started')

		await NfcManager.registerTagEvent()

		console.log('Register tag event')

		NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: TagEvent) => {
			console.log('Tag Discovered', tag);

			if (!(await NfcManager.requestTechnology(NfcTech.IsoDep))) {
				console.error('Expected NfcTech.IsoDep technology')
				return
			}

			console.log(`Peripheral, ${isPeripheral}, Central: ${isCentral}`)

			if (isPeripheral) {
				console.log('Peripheral doing stuff')

				const peripheralIdBytes = (await peripheral.getPeripheralAddress()).split('').map(x => x.charCodeAt(0))

				console.log('Send message: ', peripheralIdBytes)

				// https://en.wikipedia.org/wiki/Smart_card_application_protocol_data_unit
				const bytes = [0x0 /* CLA */, 0x0 /* P1 */, 0x0 /* P2 */, 0x1 /* LC */, ...peripheralIdBytes /* Data */, 0x0 /* LE */];

				NfcManager.isoDepHandler.transceive(bytes);

				console.log('Peripheal: Write IsoDep Message');

				// const bytes = Ndef.encodeMessage([Ndef.textRecord(await peripheral.getPeripheralAddress())])

				// if (bytes) {
					// await NfcManager.ndefHandler.writeNdefMessage(bytes)
					// await NfcManager.ndefHandler.makeReadOnly()

					// console.log('Peripheral: Write NDEF Message')
				// }
			} else if (isCentral) {
				console.log('Central doing stuff')

				const receivedTag = await NfcManager.getTag()

				console.log(receivedTag)

				// const receivedTag = await NfcManager.getTag()

				// if (receivedTag && receivedTag.ndefMessage) {
				// 	const decodedMessages = receivedTag.ndefMessage.map(record => Ndef.text.decodePayload(record.payload as unknown as Uint8Array))

				// 	if (decodedMessages.length > 0) {
				// 		const peripheralId = decodedMessages[0]

				// 		console.log(`Received message: ${peripheralId}`)

				// 		await central.fastConnect(peripheralId)

				// 		console.log('Connected to peripheral.')
				// 	}
				// }
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

	if (isCentral || isPeripheral) {
		requestPermissions()
		startCentralOrPeripheral()

		NfcManager.isSupported().then(v => {
			if (v) {
				startNfc()
			} else {
				console.error('error: NFC is not supported by this device')
			}
		})
	}

	// return () => {
	// 	if (hasNfc) {
	// 		stopNfc()
	// 	}
	// }
  }, [isCentral, isPeripheral])

  return (
	<View style={styles.container}> 
		<Button title="Use central" onPress={asCentral} />
		<Button title="Use peripheral" onPress={asPeripheral} />
		{!hasNfc && <Text>NFC is not started by the device.</Text>}
	</View>
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
