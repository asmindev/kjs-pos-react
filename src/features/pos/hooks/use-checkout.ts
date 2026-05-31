import { transactionRepository } from "../repository/transaction-repository"

export function useCheckout() {
  return {
    checkout: transactionRepository.save,
  }
}
