# From Fund to Token: Script

How a regulated fund is tokenised on Redbelly through Tokeniser. Generated from `script/script.json` by `tools/build_script_doc.py`. The shared document for fact checking is `deliverables/tokenisation-explainer-script.pdf` (also `.docx`).

- **Example asset:** An Australian wholesale managed fund (unit trust). Illustrative example, not a real fund.
- **Audience:** People with no crypto background
- **Runtime:** 88.2 seconds
- **Video:** 16:9, 1920 x 1080, 30 fps, H.264 MP4. Subtitles burned in, plus SRT and VTT files.
- **Voiceover:** 202 words, 19 lines
- **Sources read:** 26 October 2026, from the resources supplied with the brief
- **Version:** 1.0

## Story

One Australian wholesale fund, shown as an illustrative example, moves from a traditional unit register to compliant tokens on Redbelly Network, issued through Tokeniser. The film walks through the five steps Tokeniser documents in its own Knowledge Hub: legal review, setting the rules, verifying investors, issuing on Redbelly, and checked transfers. It closes on the idea that the fund, its strategy and its licence stay the same, while the infrastructure underneath changes.

## 1. The fund (0:00.0 to 0:07.3)

**Voiceover**

- `L01` This is a wholesale fund in Australia. Its investors hold units on a register.  _Sources: KH-FUND_
- `L02` How does it become a token on Redbelly?  _Sources: TK-HOME_

**On screen:** How does it become a token on Redbelly? / Wholesale fund / Australia / Unit trust / Investors hold units / Investor A / Investor B / Investor C / Investor D / Unit register / Investor / Units

**Visual:** A fund card: Wholesale fund, Australia, Unit trust. Lines run to four investors, each holding grey unit blocks. A unit register lists each holding. The question appears above: How does it become a token on Redbelly?

## 2. Today (0:07.3 to 0:12.9)

**Voiceover**

- `L03` Today, registers sit across separate systems, checks are manual, and settlement takes days.  _Sources: TK-RTT, TK-AC, TK-IS_

**On screen:** Today / Registry / Spreadsheets / Emails / Manual checks / Settlement: two business days or longer

**Visual:** Three separate cards, Registry, Spreadsheets and Emails, drift apart with broken links between them. A Manual checks card appears, then a settlement bar that fills slowly: Settlement: two business days or longer.

## 3. Step 1: Legal review (0:12.9 to 0:23.3)

**Voiceover**

- `L04` Step one. A legal review confirms the trust deed allows ownership on chain.  _Sources: KH-FUND_
- `L05` The manager's existing licence covers it. There is no separate tokenisation licence.  _Sources: KH-FUND_

**On screen:** Trust deed / On-chain ownership records permitted / Existing AFSL covers it / Covers issuance of tokenised fund interests / No separate tokenisation licence

**Visual:** Step tracker, step 1 active. A trust deed is scanned and one clause turns mint: On-chain ownership records permitted. A licence card: Existing AFSL covers it. A card marked with a cross: No separate tokenisation licence.

## 4. Step 2: Set the rules (0:23.3 to 0:32.7)

**Voiceover**

- `L06` Step two. On Tokeniser, the manager sets the rules: who can invest, foreign ownership limits, lock-up periods.  _Sources: KH-FUND, KH-COMP_
- `L07` They are written into the token itself.  _Sources: KH-WORK_

**On screen:** Tokeniser / Fund setup / Compliance rules / Investor eligibility / Wholesale / Foreign ownership limit / Lock-up period / Rules written into the token

**Visual:** A Tokeniser style Fund setup panel. Three compliance rules switch on as they are named: Investor eligibility (Wholesale), Foreign ownership limit, Lock-up period. The rules fly into a token: Rules written into the token.

## 5. Step 3: Verify investors (0:32.7 to 0:42.7)

**Voiceover**

- `L08` Step three. Each investor is verified: identity, anti-money laundering screening, investor classification.  _Sources: KH-COMP_
- `L09` Until then, no tokens can reach their wallet.  _Sources: KH-COMP_

**On screen:** Investor / Digital onboarding / Identity / AML screening / Investor classification / Wholesale / Wallet / 0x7a3f…c21e / 0x91be…04d7 / Not verified / Wallet verified / Blocked

**Visual:** An investor card ticks Identity, AML screening and Investor classification (Wholesale) as they are named. Their wallet changes to Wallet verified and a token arrives. A second, unverified wallet appears: a token stops at its lock, marked Blocked.

## 6. Step 4: Issue on Redbelly (0:42.7 to 0:51.0)

**Voiceover**

- `L10` Step four. Tokens for their units are issued on Redbelly Network, into verified wallets.  _Sources: KH-WORK_
- `L11` The register is live from the first token.  _Sources: KH-WORK_

**On screen:** Tokeniser / Issue tokens / Redbelly Network / 0x7a3f…c21e / 0x3c58…9a10 / 0x5d2e…b7f4 / Verified / Unit register / Live / Wallet / Units

**Visual:** The manager presses Issue tokens in Tokeniser. Three tokens pass through the Redbelly Network layer into three verified wallets. The unit register fills row by row and shows a Live status.

## 7. Step 5: Transfers (0:51.0 to 0:59.8)

**Voiceover**

- `L12` Step five. Every transfer is checked against those rules first.  _Sources: KH-WORK, TK-HOME_
- `L13` Break a rule, and it is rejected.  _Sources: KH-WORK, TK-AC_
- `L14` Pass, and it settles in seconds.  _Sources: KH-WORK, TK-IS_

**On screen:** Investor A / Investor B / Investor C / 0x7a3f…c21e / 0x91be…04d7 / 0x3c58…9a10 / Verified / Rule check / Eligibility / Ownership limit / Lock-up / Not eligible / Rejected: not eligible / Settled in seconds / Register updated

**Visual:** Investor A sends a token to a Rule check gate that tests eligibility, ownership limit and lock-up. A transfer towards Investor B, who is not eligible, is rejected and the token returns. A transfer to Investor C passes, shows Settled in seconds, and Register updated.

## 8. The Redbelly layer (0:59.8 to 1:17.9)

**Voiceover**

- `L15` Underneath is Redbelly Network, Australia's public digital token infrastructure.  _Sources: TK-HOME, TK-TECH_
- `L16` Every participant's identity is verified at protocol level, and confirmed transactions cannot be reversed.  _Sources: TK-GS, RB-AT_
- `L17` Its consensus is formally verified. And Australia's central bank chose Redbelly for Project Acacia.  _Sources: RB-AT, TK-TECH, TK-GS, TK-WHY_

**On screen:** Redbelly Network / Tokeniser / Issue / Settle / Public digital token infrastructure / Identity verified at protocol level / Confirmed transactions cannot be reversed / Formally verified consensus / Born from University of Sydney and CSIRO research / Chosen by Australia's central bank for Project Acacia

**Visual:** The background turns Redbelly navy and the official Redbelly logo appears. A Tokeniser layer (Issue) sits on a Redbelly Network layer (Settle) drawn as a network of nodes. Six fact cards appear as each fact is spoken.

## 9. Close (1:17.9 to 1:28.2)

**Voiceover**

- `L18` Same fund. Same strategy. Same licence.  _Sources: TK-FUNDS, KH-FUND_
- `L19` Now its units are compliant tokens on Redbelly, through Tokeniser.  _Sources: TK-HOME, KH-WORK_

**On screen:** Same fund. / Same strategy. / Same licence. / Wholesale fund / Australia / Unit trust / Investor A / Investor B / Investor C / Investor D / Compliant tokens on Redbelly / Tokeniser / tokeniser.com / Built on / Redbelly Network / Illustrative example. General information only, and not financial or legal advice.

**Visual:** Same fund. Same strategy. Same licence. appear word by word. The fund card returns and each investor's grey unit blocks turn into mint tokens: Compliant tokens on Redbelly. End card: Tokeniser, tokeniser.com, Built on Redbelly Network with the official logo, and a general information line.

_Also on screen: A tag in the top left corner marks the example as illustrative. A five step tracker runs across the top during steps one to five._
