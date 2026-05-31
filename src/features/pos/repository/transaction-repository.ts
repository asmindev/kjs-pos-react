import { saveTransaction } from "../api/transaction-api"

export const transactionRepository = {
  save: saveTransaction,
}
