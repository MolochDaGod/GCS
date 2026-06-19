import React, { useContext, useState } from "react"
import styles from "./Save.module.css"
import { ExportMenu } from "../components/ExportMenu"
import { SceneContext } from "../context/SceneContext"
import { ViewMode, ViewContext } from "../context/ViewContext"
import CustomButton from "../components/custom-button"
import { LanguageContext } from "../context/LanguageContext"
import { SoundContext } from "../context/SoundContext"
import { AudioContext } from "../context/AudioContext"
import MessageWindow from "../components/MessageWindow"
import MergeOptions from "../components/MergeOptions"
import FileDropComponent from "../components/FileDropComponent"
import PurchaseMenu from "../components/PurchaseMenu"
import { createCharacter, isAuthenticated } from "../services/grudgeAPI"


function Save() {

  // Translate hook
  const { t } = useContext(LanguageContext);
  const { playSound } = React.useContext(SoundContext)
  const { isMute } = React.useContext(AudioContext)
  const { setViewMode } = React.useContext(ViewContext);
  const { characterManager } = React.useContext(SceneContext)


  const [confirmDialogWindow, setConfirmDialogWindow] = useState(false)
  const [dialogMessage, setDialogMessage] = useState("")

  const [currentPrice, setCurrentPrice] = React.useState(0)
  const [purchaseTraits, setPurchaseTraits] = React.useState([])
  const [currency, setCurrency] = React.useState("")

  React.useEffect(() => {
    setCurrentPrice(characterManager.getCurrentTotalPrice());
    setCurrency(characterManager.getMainPriceCurrency());
  }, [])

  const back = () => {
    setViewMode(ViewMode.APPEARANCE)
    !isMute && playSound('backNextButton');
  }
  const mint = () => {
    setViewMode(ViewMode.MINT)
    !isMute && playSound('backNextButton');
  }
  const onPurchaseClick = async() =>{
    //console.log(characterManager.getPurchaseTraitsArray());
    console.log("click purch")
    setPurchaseTraits(characterManager.getPurchaseTraitsArray())
  }
  const handleFilesDrop = async(files) => {
    const file = files[0];
    if (file && file.name.toLowerCase().endsWith('.json')) {
    } 
  };
  const onConfirmPurchase = () =>{
    console.log("confirm purchase!!")
    characterManager.purchaseAssetsFromAvatar()
      .then(()=>{
        setCurrentPrice(characterManager.getCurrentTotalPrice());
        setPurchaseTraits([]);
        setConfirmDialogWindow(true);
        setDialogMessage("Purchase successful");
      })
      .catch((e)=>{
        setConfirmDialogWindow(true);
        setDialogMessage("An error occurred when trying to purchase assets. Please try again.");
      })
  }
  const cancelPurchase = () =>{
    setPurchaseTraits([]);
  }

  // Save current customized character (VRM data) to Grudge backend via grudgeAPI.
  // Links to your Grudge ID, generates UUID, starts inventory/equipment, auto cNFT path.
  // Works when launched from Hydra launcher (grudge_token injected) or after Sign In.
  const saveToGrudgeAccount = async () => {
    if (!isAuthenticated()) {
      alert('Sign in with Grudge ID (via launcher or the Sign In button) to save characters to your account.')
      return
    }
    try {
      const cm = characterManager
      // Build lightweight model3d payload from current avatar state (expandable)
      const equipped = {}
      if (cm && cm.avatar) {
        for (const [slot, data] of Object.entries(cm.avatar)) {
          if (data && (data.name || data.traitInfo)) equipped[slot] = data.name || data.traitInfo?.id || true
        }
      }
      const model3d = {
        baseModelId: 'human',
        equippedMeshes: equipped,
        weaponSlots: {},
        faceVariant: 'A',
        skinColor: '#e8c39e',
        armorColor: '#555',
        capeEnabled: false,
        scale: 1.0,
      }
      const displayName = (localStorage.getItem('name') || 'GrudgeHero').trim()
      const char = await createCharacter({
        name: displayName,
        raceId: 'human',
        classId: 'warrior',
        model3d,
      })
      alert(`Saved "${char.name}" to your Grudge account!\nID: ${char.id} • UUID linked to your Grudge ID.`)
    } catch (e) {
      alert('Save to Grudge failed: ' + (e.message || e))
    }
  }

  return (
    <div className={styles.container}>
      
      <div className={"sectionTitle"}>{t("pageTitles.saveCharacter")}</div>
      <div className={styles.buttonContainer}>
        <FileDropComponent 
          onFilesDrop={handleFilesDrop}
        />
        <CustomButton
          theme="light"
          text={t('callToAction.back')}
          size={14}
          className={styles.buttonLeft}
          onClick={back}
        />
        {purchaseTraits.length > 0 && (
          <PurchaseMenu
            currentPrice = {currentPrice}
            purchaseTraits = {purchaseTraits}
            onConfirmPurchase = {onConfirmPurchase}
            cancelPurchase = {cancelPurchase}
            currency = {currency}
            
        />)}
        
        <MergeOptions
          showCreateAtlas = {true}
          mergeMenuTitle = {"Download Options"}
        />
        <ExportMenu 
          currentPrice = {currentPrice}
          onPurchaseClick = {onPurchaseClick}
        />
        
        <CustomButton
          theme="light"
          text="Save to Grudge (ID + UUID + cNFT)"
          size={12}
          className={styles.button}
          onClick={saveToGrudgeAccount}
        />

        <CustomButton
            theme="light"
            text="mint"//{t('callToAction.mint')}
            size={14}
            className={styles.buttonRight}
            onClick={mint}
        />
      </div>
      <MessageWindow
        cancelOption = {false}
        confirmDialogText = {dialogMessage}
        confirmDialogCallback = {[]}
        confirmDialogWindow = {confirmDialogWindow}
        setConfirmDialogWindow = {setConfirmDialogWindow}
      />
    </div>
  )
}

export default Save
