# Questions for Citi

Cut from `works/citi/index.html` on 2026-09-22 when section 05 became "What we would work out with Citi." Kept here for the actual conversation. Each is a question whose answer changes what we build.

1. **Who takes the customer's payment?** Can The Ward take the payment as the merchant of record, with participating businesses beneath it, or would each business have to be established separately?
2. **Is The Ward large enough to use Spring?** Spring is sold to institutional clients. Is a platform at our size eligible? What minimum volume or other requirements apply, and what does the service cost at that scale?
3. **What does a courier have to provide before we can pay them?** The Ward does not maintain conventional resident accounts and does not want to collect identity information simply because someone makes a delivery. What would Citi require, and can Citi collect and retain it directly?
4. **When can the money be paid out?** How soon after a customer pays are funds available for the business and courier? Would Citi require a reserve or holding period?
5. **Can couriers be paid at the end of the night?** Which Citi payment methods can move money that quickly, what do they cost, and are those costs assessed per payment or for a group of payments? A Ward may make many small payments to couriers in one night, so the answer materially affects the economics.
6. **Can a tip go directly to the courier?** Can a tip be treated as the courier's money from the beginning rather than as Ward revenue that is later paid back out?
7. **What happens when an order is refunded or disputed?** If the business has prepared the order and the courier has already delivered it and been paid, who is responsible if the customer disputes the charge later, and how is it recovered?
8. **What ways can a customer pay?** Can a Ward order use pay-by-bank or instant debit as well as cards, and what does each method cost? Processing is passed through rather than treated as Ward revenue, so the method affects the final charge.
9. **Can Citi's records match ours automatically?** Can a Ward order identifier follow the transaction into Citi's reporting, with enough information to match payments back to the original split?
10. **Can a business keep its existing checkout system?** Can a restaurant keep using Toast, Square or another provider at its physical counter while The Ward handles its online orders separately? If so, what does the business have to reconcile between the two?
11. **What information does Citi keep about the customer?** What does Citi retain about someone making a Ward purchase, for how long, and can it be limited to what is necessary to process and settle that transaction?
12. **What would Citi require before a live pilot?** What would have to exist first — transaction volume, corporate structure, capital, insurance, controls or anything else? Concrete thresholds tell us what has to be built and proven.

## Questions these depend on

- **#1 drives the rest.** Merchant-of-record structure determines payout timing (#4), reserves, tip treatment (#6) and who absorbs chargebacks (#7). Ask it first.
- **#1 and #3 can change Cary itself, not just the integration.** If The Ward can't be merchant of record, the split changes. If Citi's courier identity checks are heavy, the courier model changes.

## Not Citi questions, but open

- **Money transmission.** If The Ward collects and then splits funds, it may need to be licensed as a money transmitter or payment facilitator, whoever the bank is.
- **Courier tax reporting.** The IRS generally requires a taxpayer ID from payees above 1099 thresholds. So "no identity collection" collides with tax law, not just Citi. The workable version is for Citi, not The Ward, to hold the ID.
- **Courier classification.** Whether couriers are contractors or employees affects how payouts can be structured.
