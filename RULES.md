# Community Prediction Market: System Architecture & Ruleset

## 1. Core Mechanics
The platform operates as a virtual prediction market using a play-money economy. The price of an outcome represents the community's implied probability (0% to 100%) that the event will occur.

*   **Economy:** Points are fixed and cannot be purchased with real money. 
*   **Shares:** When a user buys an outcome, they acquire "shares". If the outcome occurs, the market resolves to 100%, and each winning share pays out 1 point. Losing shares pay out 0 points.
*   **Pricing Algorithm:** The market uses the LMSR (Logarithmic Market Scoring Rule). Prices automatically adjust based on supply and demand; as users buy shares of one outcome, the price of that outcome increases, and the prices of all mutually exclusive outcomes decrease algebraically to maintain a 100% total sum.
*   **Selling:** Users can cash out (sell) their shares back to the AMM at any time before the market resolves, locking in early profits or mitigating losses based on the current market price.

## 2. Platform Structure & Taxonomy
To prevent liquidity fragmentation and choice paralysis, markets are strictly organized hierarchically:

1.  **Categories:** Overarching subjects (e.g., *Liella 7th Live Tour*, *General Anime Announcements*).
2.  **Events:** Specific, time-bound occurrences within a category (e.g., *Saitama Day 2*, *AnimeJapan 2026 Panel*).
3.  **Markets:** The individual questions tied to an event.

## 3. Market Types & Constraints
To maintain platform health, every Event is restricted to a maximum of **8 active markets**, split into two tiers:

### A. The Main Board (Max 5 per Event)
*   **Creator:** Platform Moderators/Admins only.
*   **Purpose:** The major, overarching questions of the event.
*   **Liquidity ($b$):** High (e.g., $b=200$). Requires significant point volume to swing prices, resisting manipulation by single large bettors ("whales").
*   **Visibility:** Displayed prominently on the web app homepage and Discord event summaries.

### B. The Sandbox (Max 3 per Event)
*   **Creator:** Community-proposed and voted.
*   **Purpose:** Niche, hyper-specific, or meme-related questions (e.g., MC slip-ups, specific outfits).
*   **Liquidity ($b$):** Low (e.g., $b=50$). Prices swing wildly with small bets, creating high volatility and fun narratives for casual players.
*   **Minting Cost:** If a proposal is accepted by the community, the creator must pay a 500-point "Minting Fee" to activate the market. (The creator receives 10% of the initial shares as a reward).

## 4. Market Templates
All markets must conform to one of four rigid templates to ensure database consistency and prevent resolution disputes:

1.  **Binary:** "Yes" or "No".
2.  **Multiple Choice (Mutually Exclusive):** A list of distinct options where only *one* can win (e.g., "Who will be center? A, B, or C?"). Must include an "Other" option.
3.  **Numeric Bucket:** A continuous number line chopped into mutually exclusive ranges (e.g., "<15", "15-18", "19-22", ">22").
4.  **Multi-Winner (Advanced):** Users can buy "Yes" or "No" on multiple independent outcomes within a single theme (e.g., "Which songs will be played? [ ] Song A [ ] Song B [ ] Song C"). *Note: This functions as multiple independent Binary markets under the hood.*

## 5. The Proposal & Resolution Pipeline

### Step 1: Proposal (Pre-Event)
Users submit a market proposal via a Discord modal, strictly defining the Question, Template Options, and **Resolution Criteria** (exactly what constitutes a "Yes" or a "Win", explicitly closing loopholes). The proposal is posted to a public `#market-proposals` channel.

### Step 2: Vetting (Pre-Event)
The community debates the Resolution Criteria in the Discord thread. The proposer can edit the criteria based on feedback. The community votes using reactions. If a proposal hits a set threshold (e.g., +15 net positive votes), the creator is prompted to pay the Minting Fee to push the market live to the Sandbox.

### Step 3: Resolution & Disputes (Post-Event)
1.  **Initial Resolution:** Within 24 hours of the event concluding, the market creator (or a Mod for Main Board markets) selects the winning outcome based on the agreed-upon Resolution Criteria.
2.  **Dispute Window:** A 12-hour window opens where any user can click `[Dispute]` via the Discord bot if they believe the creator ruled incorrectly.
3.  **Tribunal:** If the dispute threshold is met, the payout is frozen. Moderators review the event footage against the Strict Resolution Criteria and make a final, immutable ruling.

## 6. Edge Cases & Safety Mechanisms
*   **Cancelation:** If an event is canceled entirely, all markets associated with that Event are voided. All users are refunded their exact purchase costs; no one wins or loses.
*   **Ambiguity:** If an outcome occurs that explicitly violates the spirit of the market but isn't covered in the Resolution Criteria (an "Act of God"), Moderators reserve the right to forcefully void and refund the market to protect the community economy.
*   **Zero-Sum Guarantee:** The AMM algorithm physically prevents the platform from ever paying out more points than exist in the system's mathematical bounds.
