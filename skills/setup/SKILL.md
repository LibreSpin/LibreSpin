---
description: LibreSpin distributor API credential setup — configure API keys for Nexar, DigiKey, Mouser, Arrow, Newark, and LCSC
argument-hint: "[--supplier SUPPLIER]"
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - Bash
---

# /librespin:setup

Configure API credentials for distributor inventory and pricing APIs. Walks through each supplier interactively, validates credentials with a live test call, and saves to `~/.librespin/credentials`.

Supported suppliers: `nexar`, `digikey`, `mouser`, `arrow`, `newark`, `lcsc`

---

## Step 1: Parse Arguments

Extract the optional `--supplier SUPPLIER` flag from `$ARGUMENTS`.

```
SUPPLIER_FILTER=""

if $ARGUMENTS contains "--supplier":
  Extract the value after "--supplier"
  Set SUPPLIER_FILTER to that value (lowercase)
  Valid values: nexar, digikey, mouser, arrow, newark, lcsc
  If value is not one of the above: show error and stop
    "Unknown supplier: VALUE. Valid values: nexar, digikey, mouser, arrow, newark, lcsc"

if SUPPLIER_FILTER is set:
  Only configure that one supplier (skip all others)
else:
  Configure all 6 suppliers in order
```

---

## Step 2: Check Prerequisites and Ensure Credentials File

Run this exact bash block:

```bash
# Check for jq (required for JSON response parsing)
if command -v jq > /dev/null 2>&1; then
  echo "JQ_FOUND: $(jq --version)"
else
  echo "JQ_MISSING"
fi
```

**If result contains `JQ_MISSING`:** Show the following error and **stop**:

```
ERROR: jq is required but not installed.

All distributor APIs return JSON. Without jq, credential validation cannot
parse any API responses — setup cannot verify that your credentials work.

Install jq first, then re-run /librespin:setup:

  sudo apt install jq        # Debian / Ubuntu
  brew install jq            # macOS
  winget install jqlang.jq   # Windows
```

Then run this bash block to create or confirm the credentials file:

```bash
mkdir -p "$HOME/.librespin"
if [ ! -f "$HOME/.librespin/credentials" ]; then
  cat > "$HOME/.librespin/credentials" << 'CREDS'
# ~/.librespin/credentials
# Managed by /librespin:setup — do not edit manually

[nexar]
client_id =
client_secret =
access_token =
token_expires =
parts_used = 0
parts_limit = 100

[digikey]
client_id =
client_secret =
access_token =
token_expires =

[mouser]
part_api_key =

[arrow]
login =
api_key =

[newark]
api_key =
storefront = us.newark.com

[lcsc]
api_key =
use_public_endpoint = true
CREDS
  echo "CREATED: ~/.librespin/credentials"
else
  echo "FOUND: ~/.librespin/credentials"
fi
```

**If result contains `CREATED`:** Inform user: "Created `~/.librespin/credentials` with empty sections for all suppliers."
**If result contains `FOUND`:** Inform user: "Found existing `~/.librespin/credentials` — existing credentials will be preserved; you can update or skip each section."

---

## Step 2.5: Write Secure Secret Entry Helper

API secrets must never be pasted into the Claude Code chat — they appear in conversation history. This step writes a helper script that collects secrets in the user's own terminal using `read -s` (silent input), then writes directly to the credentials file without the value ever passing through chat.

Run this bash block:

```bash
cat > "$HOME/.librespin/set-secret.sh" << 'SCRIPT'
#!/bin/bash
# LibreSpin secure credential entry — value never shown in terminal or chat
# Usage: set-secret.sh SECTION KEY "Prompt label"
section="$1" key="$2" label="${3:-Value}"
IFS= read -r -s -p "$label: " LIBRESPIN_SECRET_VAL && echo
export LIBRESPIN_SECRET_VAL
python3 -c "
import os, sys
section = sys.argv[1]; key = sys.argv[2]
val = os.environ.pop('LIBRESPIN_SECRET_VAL', '')
fp = os.path.expanduser('~/.librespin/credentials')
lines = open(fp).readlines()
in_sec = False
for i, l in enumerate(lines):
    stripped = l.strip()
    if stripped == f'[{section}]': in_sec = True
    elif stripped.startswith('[') and stripped != f'[{section}]': in_sec = False
    elif in_sec and l.startswith(f'{key} ='):
        lines[i] = f'{key} = {val}\n'; in_sec = False
open(fp, 'w').writelines(lines)
print('Saved.')
" "$section" "$key"
unset LIBRESPIN_SECRET_VAL
SCRIPT
chmod +x "$HOME/.librespin/set-secret.sh"
echo "HELPER_WRITTEN"
```

If result is `HELPER_WRITTEN`, tell user:

```
Secure entry ready. For each API secret, you'll be given a command to run in your
own terminal — the value will not appear in this chat.
```

---

## Step 3: Define Credential Helper Functions

Run this bash block to define helper functions used throughout the setup. Keep these in scope for all subsequent bash blocks in this session:

```bash
read_credential() {
  local section="$1" key="$2" file="$HOME/.librespin/credentials"
  grep -A50 "^\[$section\]" "$file" | grep -m1 "^$key" | awk -F' = ' '{print $2}' | tr -d '\r\n'
}

write_credential() {
  local section="$1" key="$2" value="$3" file="$HOME/.librespin/credentials"
  # Update key within section (GNU sed — Linux primary target)
  sed -i "/^\[$section\]/,/^\[/{s|^$key = .*|$key = $value|}" "$file"
}

is_token_expired() {
  local expires="$1"
  local now
  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  [[ "$now" > "$expires" ]]
}

echo "HELPERS_DEFINED"
```

If result is `HELPERS_DEFINED`, continue. Otherwise report the error and stop.

---

## Step 4: Configure Each Supplier

Process suppliers in order: Nexar, DigiKey, Mouser, Arrow, Newark, LCSC. If `SUPPLIER_FILTER` is set, skip any supplier not matching the filter.

For each supplier, follow the sub-steps below. Per-supplier credential prompts and validation blocks are defined in sub-sections 4.1 through 4.6.

**Standard sub-steps for each supplier:**

**4a. Read current status.** Run a bash block to check if credentials exist:
```bash
# Example for nexar — adapt section name per supplier
CURRENT=$(read_credential nexar client_id)
if [ -n "$CURRENT" ]; then
  echo "STATUS: configured (client_id present)"
else
  echo "STATUS: not configured"
fi
```

**4b. Ask user.** Use `AskUserQuestion`:
```
"[SupplierName] Setup

Current status: [configured / not configured]
[Brief description of what this supplier provides and what credentials are needed]

Enter 'yes' to configure, or press Enter / type 'skip' to leave unchanged."
```

**4c. Skip if not 'yes'.** If response is not `yes` (case-insensitive), print `"Skipping [SupplierName]."` and move to next supplier.

**4d. Prompt for credentials.** Use `AskUserQuestion` per credential field (supplier-specific, see 4.1–4.6).

**4e. Write credentials.** Run `write_credential` for each field entered.

**4f. Run validation test.** Execute the supplier-specific validation bash block (see 4.1–4.6).

**4g. On validation pass.** Print: `"VALID — [SupplierName] configured successfully."` Write any derived values (tokens, expiry) back to credentials.

**4h. On validation fail.** Print the error returned. Use `AskUserQuestion`:
```
"Validation failed for [SupplierName]. Error: [error detail]

Options:
  retry   — enter credentials again
  skip    — leave [SupplierName] unconfigured for now
  force   — save credentials anyway (skip validation)"
```
If `retry`: repeat from 4d. If `skip` or `force`: proceed accordingly.

---

### 4.1 Nexar (Octopart)

**About:** GraphQL API. OAuth 2.0 client credentials — provide client_id + client_secret, token is fetched automatically. Free tier: **100 matched parts total** (not per month — this counter does not reset). Parts used will be tracked in credentials file.

**client_id — collect via AskUserQuestion:**

```
"Nexar Client ID:
Obtain at: platform.nexar.com → My Apps → Create App
Paste your client_id:"
```

Write to credentials:
```bash
write_credential nexar client_id "$NEXAR_CLIENT_ID"
```

**client_secret — collect securely, NOT via AskUserQuestion:**

Display this as plain text (not a question):
```
Run this in your terminal — the value will not appear in chat:
  ~/.librespin/set-secret.sh nexar client_secret "Nexar Client Secret"
```

Then use AskUserQuestion:
```
"Nexar Client Secret — ready to continue?
1. done — secret saved, run validation
2. skip — leave Nexar unconfigured for now"
```

If 'skip': move to next supplier. If 'done': proceed to validation (reads secret from file).

**Show this notice before validation:**
```
NOTICE: Nexar free tier — 100 matched parts total lifetime limit. The skill
tracks parts_used in your credentials file and warns when you approach the limit.
After 100 matched parts, you will need a paid Nexar plan.
```

**Token acquisition and validation:**
```bash
NEXAR_CLIENT_ID=$(read_credential nexar client_id)
NEXAR_CLIENT_SECRET=$(read_credential nexar client_secret)

NEXAR_RESPONSE=$(curl -s --request POST 'https://identity.nexar.com/connect/token' \
  --header 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=client_credentials' \
  --data-urlencode "client_id=$NEXAR_CLIENT_ID" \
  --data-urlencode "client_secret=$NEXAR_CLIENT_SECRET" \
  --data-urlencode 'scope=supply.domain')

NEXAR_TOKEN=$(echo "$NEXAR_RESPONSE" | jq -r '.access_token // empty')
NEXAR_ERROR=$(echo "$NEXAR_RESPONSE" | jq -r '.error // empty')

if [ -z "$NEXAR_TOKEN" ]; then
  echo "TOKEN_FAIL: ${NEXAR_ERROR:-unknown error}"
else
  echo "TOKEN_OK"
  # Calculate expiry: 23 hours from now (24h lifetime with 1h safety buffer)
  NEXAR_EXPIRY=$(date -u -d "+23 hours" +%Y-%m-%dT%H:%M:%SZ)

  # Quota pre-check — read current parts_used before consuming one more
  CURRENT_PARTS=$(read_credential nexar parts_used 2>/dev/null || echo 0)
  CURRENT_PARTS=$(( CURRENT_PARTS + 0 ))  # ensure numeric

  if [ "$CURRENT_PARTS" -ge 100 ]; then
    echo "QUOTA_EXHAUSTED: Nexar quota exhausted (${CURRENT_PARTS}/100 parts used). Cannot run validation test — credentials saved without live test."
  else
    if [ "$CURRENT_PARTS" -ge 80 ]; then
      echo "QUOTA_WARNING: You have used ${CURRENT_PARTS}/100 Nexar free-tier parts. Approaching quota limit."
    fi

    # Test query — validate token works and API is reachable
    NEXAR_TEST=$(curl -s -X POST 'https://api.nexar.com/graphql/' \
      -H "Authorization: Bearer $NEXAR_TOKEN" \
      -H 'Content-Type: application/json' \
      -d '{"query": "query { supSearchMpn(q: \"LM358\", limit: 1) { hits } }"}')
    NEXAR_HITS=$(echo "$NEXAR_TEST" | jq -r '.data.supSearchMpn.hits // 0')
    NEXAR_TEST_ERROR=$(echo "$NEXAR_TEST" | jq -r '.errors[0].message // empty')

    if [ "$NEXAR_HITS" -gt 0 ] 2>/dev/null; then
      echo "VALID: hits=$NEXAR_HITS"
    else
      echo "INVALID: ${NEXAR_TEST_ERROR:-no hits returned for LM358 test query}"
    fi
  fi
fi
```

**On VALID (and on QUOTA_EXHAUSTED):** Write token and expiry; increment parts_used by 1 if test ran:
```bash
write_credential nexar access_token "$NEXAR_TOKEN"
write_credential nexar token_expires "$NEXAR_EXPIRY"
if [ "$CURRENT_PARTS" -lt 100 ]; then
  write_credential nexar parts_used $(( CURRENT_PARTS + 1 ))
else
  # Quota exhausted — preserve the existing count, do not increment past 100
  write_credential nexar parts_used "$CURRENT_PARTS"
fi
```

---

### 4.2 DigiKey

**About:** OAuth 2.0 client credentials. Token expires in ~10 minutes — the skill refreshes automatically before each use. Create a Production app (not sandbox) at developer.digikey.com for client credentials grant access.

**client_id — collect via AskUserQuestion:**

```
"DigiKey Client ID:
1. Go to developer.digikey.com
2. Sign in → My Apps → Create App
3. Select 'Production' environment
4. Enable 'Product Information' API (LibreSpin only reads pricing and stock — no ordering)
5. Copy the Client ID:
Paste your client_id:"
```

Write to credentials:
```bash
write_credential digikey client_id "$DK_CLIENT_ID"
```

**client_secret — collect securely, NOT via AskUserQuestion:**

Display this as plain text:
```
Run this in your terminal — the value will not appear in chat:
  ~/.librespin/set-secret.sh digikey client_secret "DigiKey Client Secret"
```

Then use AskUserQuestion:
```
"DigiKey Client Secret — ready to continue?
1. done — secret saved, run validation
2. skip — leave DigiKey unconfigured for now"
```

If 'skip': move to next supplier. If 'done': proceed to validation.

**Token acquisition and validation:**
```bash
DK_CLIENT_ID=$(read_credential digikey client_id)
DK_CLIENT_SECRET=$(read_credential digikey client_secret)

DK_RESPONSE=$(curl -s -X POST 'https://api.digikey.com/v1/oauth2/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "client_id=$DK_CLIENT_ID&client_secret=$DK_CLIENT_SECRET&grant_type=client_credentials")

DK_TOKEN=$(echo "$DK_RESPONSE" | jq -r '.access_token // empty')
DK_ERROR=$(echo "$DK_RESPONSE" | jq -r '.error // empty')

if [ -z "$DK_TOKEN" ]; then
  echo "TOKEN_FAIL: ${DK_ERROR:-unknown error}"
else
  echo "TOKEN_OK"
  # Expiry: 9 minutes from now (10-minute lifetime with 1-minute buffer)
  DK_EXPIRY=$(date -u -d "+9 minutes" +%Y-%m-%dT%H:%M:%SZ)

  # Validation test — POST keyword search (V4). X-DIGIKEY-Client-Id is REQUIRED.
  DK_TEST=$(curl -s -X POST "https://api.digikey.com/products/v4/search/keyword" \
    -H "Authorization: Bearer $DK_TOKEN" \
    -H "X-DIGIKEY-Client-Id: $DK_CLIENT_ID" \
    -H "X-DIGIKEY-Locale-Site: US" \
    -H "X-DIGIKEY-Locale-Language: en" \
    -H "X-DIGIKEY-Locale-Currency: USD" \
    -H "Content-Type: application/json" \
    -d '{"Keywords": "LM358", "Limit": 1}')

  DK_COUNT=$(echo "$DK_TEST" | jq -r '.Products | length' 2>/dev/null || echo "0")
  DK_TEST_ERROR=$(echo "$DK_TEST" | jq -r '.ErrorMessage // .error // empty' 2>/dev/null || echo "")

  if [ "${DK_COUNT:-0}" -gt 0 ] 2>/dev/null; then
    echo "VALID: products=$DK_COUNT"
  else
    echo "INVALID: ${DK_TEST_ERROR:-unexpected response format}"
  fi
fi
```

**CRITICAL:** The `X-DIGIKEY-Client-Id` header is required on every DigiKey API request (not just the token request). Omitting it causes auth failure even with a valid Bearer token.

**On VALID:** Write token and expiry:
```bash
write_credential digikey access_token "$DK_TOKEN"
write_credential digikey token_expires "$DK_EXPIRY"
```

---

### 4.3 Mouser

**About:** Simple API key — no OAuth needed. The search API key is separate from the order API key. Register at mouser.com and request the **Search API** key from the developer portal. Rate limit: 1000 requests/day.

**part_api_key — collect securely, NOT via AskUserQuestion:**

Display this as plain text:
```
Mouser Search API Key:
1. Go to mouser.com → Account → API Keys (or mouser.com/api)
2. Generate a Search API key (NOT the Order API key — they are separate)

Then run this in your terminal — the value will not appear in chat:
  ~/.librespin/set-secret.sh mouser part_api_key "Mouser Search API Key"
```

Then use AskUserQuestion:
```
"Mouser API Key — ready to continue?
1. done — key saved, run validation
2. skip — leave Mouser unconfigured for now"
```

If 'skip': move to next supplier. If 'done': proceed to validation.

**Validation:**
```bash
MOUSER_KEY=$(read_credential mouser part_api_key)

MOUSER_TEST=$(curl -s -X POST "https://api.mouser.com/api/v1/search/partnumber?apiKey=$MOUSER_KEY" \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"SearchByPartRequest": {"mouserPartNumber": "LM358", "partSearchOptions": ""}}')

MOUSER_COUNT=$(echo "$MOUSER_TEST" | jq -r '.SearchResults.Parts | length' 2>/dev/null || echo "0")
MOUSER_ERROR=$(echo "$MOUSER_TEST" | jq -r '.SearchResults.Errors[]?.Message // empty' 2>/dev/null || echo "")

if [ "${MOUSER_COUNT:-0}" -gt 0 ] 2>/dev/null; then
  echo "VALID: parts=$MOUSER_COUNT"
else
  echo "INVALID: ${MOUSER_ERROR:-no parts returned for LM358 test query}"
fi
```

---

### 4.4 Arrow

**About:** API key auth with both account login (email) and API key required. Arrow API access requires contacting api@arrow.com or submitting a request at developers.arrow.com. This is not instant — it may take several business days.

**login — collect via AskUserQuestion** (account email, not a secret):

```
"Arrow API Login (your Arrow account email):
Arrow API requires both your account login and an API key.
If you do not have API access, visit developers.arrow.com to request it
(note: approval may take several business days — skip for now if pending).
Paste your Arrow account email:"
```

Write to credentials:
```bash
write_credential arrow login "$ARROW_LOGIN"
```

**api_key — collect securely, NOT via AskUserQuestion:**

Display this as plain text:
```
Run this in your terminal — the value will not appear in chat:
  ~/.librespin/set-secret.sh arrow api_key "Arrow API Key"
```

Then use AskUserQuestion:
```
"Arrow API Key — ready to continue?
1. done — key saved, run validation
2. skip — leave Arrow unconfigured for now"
```

If 'skip': move to next supplier. If 'done': proceed to validation.

**Validation:**
```bash
ARROW_LOGIN=$(read_credential arrow login)
ARROW_API_KEY=$(read_credential arrow api_key)

ARROW_TEST=$(curl -s "https://api.arrow.com/itemservice/v4/en/search?term=LM358&login=$ARROW_LOGIN&apikey=$ARROW_API_KEY")
ARROW_COUNT=$(echo "$ARROW_TEST" | jq -r '.itemserviceresult.data | length' 2>/dev/null || echo "0")
ARROW_ERROR=$(echo "$ARROW_TEST" | jq -r '.itemserviceresult.errormessage // empty' 2>/dev/null || echo "")

if [ "${ARROW_COUNT:-0}" -gt 0 ] 2>/dev/null; then
  echo "VALID: results=$ARROW_COUNT"
else
  echo "INVALID: ${ARROW_ERROR:-no results returned for LM358 test query}"
fi
```

---

### 4.5 Newark / Farnell (element14)

**About:** One element14 API key covers Newark (US), Farnell (UK/EU), and element14 (Asia). Register at partner.element14.com — self-service, no enterprise agreement required for Product Search API. Select the storefront that matches your region.

**api_key — collect securely, NOT via AskUserQuestion:**

Display this as plain text:
```
element14 / Newark / Farnell API Key:
1. Go to partner.element14.com
2. Register and apply for Product Search API access
3. Copy your API key once approved

Then run this in your terminal — the value will not appear in chat:
  ~/.librespin/set-secret.sh newark api_key "Newark/element14 API Key"
```

Then use AskUserQuestion:
```
"Newark/element14 API Key — ready to continue?
1. done — key saved
2. skip — leave Newark unconfigured for now"
```

If 'skip': move to next supplier.

**storefront — collect via AskUserQuestion** (not a secret):

```
"element14 Storefront (press Enter for default: us.newark.com):
Options:
  us.newark.com      — Newark (United States)
  uk.farnell.com     — Farnell (UK/Europe)
  sg.element14.com   — element14 (Asia-Pacific)
Enter storefront or press Enter for us.newark.com:"
```

If user presses Enter or provides empty input, use `us.newark.com`.

Write to credentials:
```bash
write_credential newark storefront "$NEWARK_STOREFRONT"
```

**Validation:**
```bash
NEWARK_KEY=$(read_credential newark api_key)
NEWARK_STOREFRONT=$(read_credential newark storefront)
NEWARK_STOREFRONT="${NEWARK_STOREFRONT:-us.newark.com}"

NEWARK_TEST=$(curl -s \
  "https://api.element14.com/catalog/sandboxed/products;keywordList=LM358;storeInfo.id=$NEWARK_STOREFRONT/v1/xml-data/productDetails/manufacturer?apikey=$NEWARK_KEY" \
  -H 'Accept: application/json')

NEWARK_COUNT=$(echo "$NEWARK_TEST" | jq -r '.manufacturerProductDetailResponse.products | length' 2>/dev/null || echo "0")
NEWARK_ERROR=$(echo "$NEWARK_TEST" | jq -r '.manufacturerProductDetailResponse.header.status // empty' 2>/dev/null || echo "")

if [ "${NEWARK_COUNT:-0}" -gt 0 ] 2>/dev/null; then
  echo "VALID: products=$NEWARK_COUNT"
else
  # Check for known error indicators
  if echo "$NEWARK_TEST" | grep -qi "InvalidApiKey\|Unauthorized\|Forbidden"; then
    echo "INVALID: API key rejected"
  else
    echo "INVALID: ${NEWARK_ERROR:-no products returned for LM358 test query}"
  fi
fi
```

---

### 4.6 LCSC

**About:** LCSC is the preferred supplier for low-cost Chinese components. Two modes available — choose based on your access level.

**Mode selection (AskUserQuestion):**

```
"LCSC Configuration

LCSC offers two access modes:

  A) Official API (api_key required)
     - Apply at lcsc.com/docs/openapi — requires account and approval
     - Rate limit: 1000 searches/day, 200/minute
     - Stable and officially supported

  B) Public endpoint (no key needed)
     - Uses wmsc.lcsc.com — the same endpoint the LCSC website uses
     - No auth required for basic search
     - Not officially documented — may change without notice

Enter 'A' for official API, 'B' for public endpoint, or 'skip' to skip LCSC:"
```

**If Mode A (Official API):**

Display this as plain text (NOT AskUserQuestion):
```
LCSC API Key — apply at lcsc.com/docs/openapi (requires an LCSC account).

Run this in your terminal — the value will not appear in chat:
  ~/.librespin/set-secret.sh lcsc api_key "LCSC API Key"
```

Then use AskUserQuestion:
```
"LCSC API Key — ready to continue?
1. done — key saved, run validation
2. skip — leave LCSC unconfigured for now"
```

If 'skip': move on. If 'done': proceed to validation.

Write mode flag to credentials:
```bash
write_credential lcsc use_public_endpoint false
```

Validation (Mode A):
```bash
LCSC_API_KEY=$(read_credential lcsc api_key)

LCSC_TEST=$(curl -s -H "Authorization: $LCSC_API_KEY" "https://lcsc.com/api/search?q=LM358&limit=5")
LCSC_COUNT=$(echo "$LCSC_TEST" | jq -r '.result.data | length' 2>/dev/null || echo "0")
LCSC_ERROR=$(echo "$LCSC_TEST" | jq -r '.message // .error // empty' 2>/dev/null || echo "")

if [ "${LCSC_COUNT:-0}" -gt 0 ] 2>/dev/null; then
  echo "VALID: results=$LCSC_COUNT"
elif echo "$LCSC_TEST" | grep -qi "unauthorized\|forbidden\|invalid"; then
  echo "INVALID: API key rejected — verify key at lcsc.com/docs/openapi"
else
  # Fallback check: any non-error JSON response is acceptable
  if echo "$LCSC_TEST" | jq -e . > /dev/null 2>&1; then
    echo "PARTIAL: API responded but result format unclear — saved key anyway"
  else
    echo "INVALID: ${LCSC_ERROR:-no valid response from LCSC official API}"
  fi
fi
```

**If Mode B (Public endpoint):**

Write to credentials:
```bash
write_credential lcsc api_key ""
write_credential lcsc use_public_endpoint true
```

Show notice:
```
NOTICE: Using LCSC public endpoint (wmsc.lcsc.com). This endpoint is used by
the LCSC website but is not officially documented and may change without notice.
For stable access, apply for official LCSC API at lcsc.com/docs/openapi.
```

Validation (Mode B):
```bash
LCSC_TEST=$(curl -s "https://wmsc.lcsc.com/wmsc/search/global?keyword=LM358&currentPage=1&pageSize=5")
LCSC_COUNT=$(echo "$LCSC_TEST" | jq -r '.result.data | length' 2>/dev/null || echo "0")

# Fallback without jq: check for non-empty data field
if [ "${LCSC_COUNT:-0}" -gt 0 ] 2>/dev/null; then
  echo "VALID: results=$LCSC_COUNT"
elif echo "$LCSC_TEST" | grep -q '"data"'; then
  echo "VALID: endpoint reachable (jq parse limited)"
else
  echo "INVALID: wmsc.lcsc.com did not return expected JSON"
fi
```

---

## Step 5: Summary

After all suppliers are processed, run this bash block:

```bash
echo "=== /librespin:setup Complete ==="
echo ""
echo "Configured suppliers:"
for section in nexar digikey mouser arrow newark lcsc; do
  # Check if any primary credential key is set for this section
  val=$(grep -A50 "^\[$section\]" "$HOME/.librespin/credentials" \
    | grep -m1 "^\(client_id\|part_api_key\|api_key\|login\) = ." \
    | awk -F' = ' '{print $2}' | tr -d '\r\n')
  if [ -n "$val" ]; then
    echo "  CONFIGURED: $section"
  else
    # Special case: lcsc with use_public_endpoint = true is considered configured
    lcsc_mode=$(grep -A50 "^\[lcsc\]" "$HOME/.librespin/credentials" | grep -m1 "^use_public_endpoint" | awk -F' = ' '{print $2}' | tr -d '\r\n')
    if [ "$section" = "lcsc" ] && [ "$lcsc_mode" = "true" ]; then
      echo "  CONFIGURED: lcsc (public endpoint)"
    else
      echo "  NOT_CONFIGURED: $section"
    fi
  fi
done
echo ""
echo "Credentials saved to: ~/.librespin/credentials"
echo ""
echo "Next: Run /librespin:concept — Phase 4 will automatically enrich components"
echo "      with live inventory and pricing from configured suppliers."
```

Display the output to the user.

If any suppliers show `NOT_CONFIGURED` and the user has not explicitly skipped them, suggest:
```
To configure a specific supplier later: /librespin:setup --supplier SUPPLIER
```

---

## Error Handling Notes

- **API call timeouts:** If a curl call hangs (network issue), use `curl --max-time 15` in all validation blocks. If timeout occurs, treat as validation failure and offer retry/skip.
- **jq absent:** Where jq parsing is used, always provide a `|| echo "fallback"` or `2>/dev/null` guard. For LCSC public endpoint, use `grep -q '"data"'` as the fallback check.
- **Nexar quota exhaustion:** If the supSearchMpn response contains `{"errors":[{"message":"...quota..."}]}`, show: "Nexar free tier (100 parts) exhausted — upgrade at platform.nexar.com or configure a different supplier." Then continue with other suppliers.
- **DigiKey token expiry during concept:** When concept Phase 4 reads DigiKey credentials, it must check `token_expires` before every API call and re-acquire a token if expired (10-minute lifetime).
- **General rule (D-17):** Any supplier API failure during concept enrichment must log inline and continue — never block workflow progress.

---

## Token Lifetime Reference

| Supplier | Token Lifetime | Cache Key |
|----------|---------------|-----------|
| Nexar    | 24 hours      | `[nexar] token_expires` — refresh when expired with 1h buffer |
| DigiKey  | ~10 minutes   | `[digikey] token_expires` — check before every API call |
| Mouser   | N/A (API key) | No refresh needed |
| Arrow    | N/A (API key) | No refresh needed |
| Newark   | N/A (API key) | No refresh needed |
| LCSC     | N/A (API key) | No refresh needed |
