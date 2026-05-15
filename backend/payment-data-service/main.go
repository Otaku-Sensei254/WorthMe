package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"

	"worthme.com/payment-rails/mpesa"
)

// In-memory store for simulation/demo. In production, use Redis or Postgres.
var (
	balanceStore = make(map[string]interface{})
	storeMutex   sync.RWMutex
)

// Simple .env loader since we might not have godotenv installed yet
func loadEnv() {
	file, err := os.Open("../.env")
	if err != nil {
		log.Println("⚠️ No .env file found in parent directory. Using system env variables.")
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		// Remove 'export ' prefix if it exists
		line = strings.TrimPrefix(line, "export ")
		
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.Trim(strings.TrimSpace(parts[1]), "\"'")
			os.Setenv(key, value)
			
			// Map your specific .env names to what the code expects
			if key == "MPESA_CUSTOMER_CONSUMER_KEY" { os.Setenv("MPESA_CONSUMER_KEY", value) }
			if key == "MPESA_CUSTOMER_CONSUMER_SECRET" { os.Setenv("MPESA_CONSUMER_SECRET", value) }
			if key == "MPESA_CUSTOMER_PASSKEY" { os.Setenv("MPESA_PASSKEY", value) }
		}
	}
	log.Println("✅ Environment variables loaded and mapped from backend/.env")
}

func main() {
	loadEnv()
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/api/mpesa/balance/request", mpesaBalanceRequestHandler)
	http.HandleFunc("/api/mpesa/callback", mpesaCallbackHandler)
	http.HandleFunc("/api/mpesa/balance/status", mpesaBalanceStatusHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🚀 Payment Data Service listening on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "WorthMe Payment Data Service is active.")
}

// 1. Start the balance inquiry
func mpesaBalanceRequestHandler(w http.ResponseWriter, r *http.Request) {
	// Decode incoming request from Phoenix
	var requestBody struct {
		ShortCode   string `json:"short_code"`
		PhoneNumber string `json:"phone_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		log.Printf("Error decoding request body: %v", err)
	}

	apiKey := os.Getenv("MPESA_CONSUMER_KEY")
	consumerSecret := os.Getenv("MPESA_CONSUMER_SECRET")
	passKey := os.Getenv("MPESA_PASSKEY")

	// 1. Determine Shortcode
	shortCodeStr := requestBody.ShortCode
	if shortCodeStr == "" {
		shortCodeStr = os.Getenv("MPESA_SHORTCODE")
	}
	shortCode, _ := strconv.Atoi(shortCodeStr)
	if shortCode == 0 {
		shortCode = 174379 
	}

	client, err := mpesa.NewClient(apiKey, consumerSecret, passKey, mpesa.SANDBOX)
	if err != nil {
		log.Printf("Failed to init M-Pesa client: %v", err)
		http.Error(w, "Failed to init M-Pesa client", http.StatusInternalServerError)
		return
	}

	initiator := os.Getenv("MPESA_INITIATOR_NAME")
	if initiator == "" {
		initiator = "TestInitiator"
	}

	securityCred := os.Getenv("MPESA_SECURITY_CREDENTIAL")
	if securityCred == "" {
		securityCred = "Safaricom015!" 
	}

	params := mpesa.AccountBalanceParams{
		Initiator:          initiator,
		SecurityCredential: securityCred,
		CommandID:          "AccountBalance",
		PartyA:             shortCode,
		IdentifierType:     4, 
		Remarks:            "WorthMe Balance Query",
		QueueTimeOutURL:    os.Getenv("MPESA_CALLBACK_URL"),
		ResultURL:          os.Getenv("MPESA_CALLBACK_URL"),
	}

	resp, err := client.AccountBalance(params)
	if err != nil {
		log.Printf("M-Pesa API Error: %v", err)
		http.Error(w, fmt.Sprintf("M-Pesa API Error: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "Request Accepted",
		"conversation_id": resp.ConversationID,
		"origin_id":       resp.OriginatorConversationID,
		"target_shortcode": shortCode,
	})
}

// 2. The "Listener" - Safaricom hits this URL
func mpesaCallbackHandler(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	log.Printf("📥 Received Callback from Safaricom: %s", string(body))

	var callbackData map[string]interface{}
	if err := json.Unmarshal(body, &callbackData); err == nil {
		if result, ok := callbackData["Result"].(map[string]interface{}); ok {
			convID, _ := result["ConversationID"].(string)
			if convID != "" {
				storeMutex.Lock()
				balanceStore[convID] = result
				storeMutex.Unlock()
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "{\"ResultCode\":0, \"ResultDesc\":\"Success\"}")
}

// 3. The Frontend polls this to see if the balance has arrived yet
func mpesaBalanceStatusHandler(w http.ResponseWriter, r *http.Request) {
	convID := r.URL.Query().Get("conversation_id")
	
	storeMutex.RLock()
	data, exists := balanceStore[convID]
	storeMutex.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	if !exists {
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "pending"})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "completed",
		"data":   data,
	})
}
