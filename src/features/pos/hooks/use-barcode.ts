import { useState } from "react"

export function useBarcode() {
  const [barcode, setBarcode] = useState("")

  return {
    barcode,
    setBarcode,
  }
}
