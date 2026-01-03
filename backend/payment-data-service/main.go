package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"worthme.com/payment-rails/mpesa" // Import the mpesa sub-package
)

func main() {
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/account/balance", getAccountBalanceHandler)

	port := "8080"
	fmt.Printf("Payment Data Service listening on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Payment Data Service is running!")
}

func getAccountBalanceHandler(w http.ResponseWriter, r *http.Request) {
	// In a real scenario, you would parse request parameters (e.g., user ID, bank),
	// initialize the correct payment-rails client for the specific bank (e.g., Mpesa, KCB),
	// and then call its AccountBalance function.

	// Placeholder API keys - replace with actual environment variables or a config system
	apiKey := os.Getenv("MPESA_API_KEY")
	consumerSecret := os.Getenv("MPESA_CONSUMER_SECRET")
	passKey := os.Getenv("MPESA_PASS_KEY")

	// Initialize the mpesa client
	client, err := mpesa.NewClient(apiKey, consumerSecret, passKey, mpesa.SANDBOX)
	if err != nil {
		log.Printf("Error initializing M-Pesa client: %v", err)
		http.Error(w, "Failed to initialize M-Pesa client", http.StatusInternalServerError)
		return
	}

	// For demonstration, populate with example AccountBalanceParams
	// In a real application, these would come from the request.
	params := mpesa.AccountBalanceParams{
		Initiator:          "TestInitiator", // Replace with actual initiator
		SecurityCredential: "TestSecurityCredential", // Replace with actual security credential
		CommandID:          "AccountBalance",
		PartyA:             600999, // Replace with actual short code
		IdentifierType:     4,      // Replace with actual identifier type (e.g., till number)
		Remarks:            "Account Balance Query",
		QueueTimeOutURL:    "https://example.com/timeout",
		ResultURL:          "https://example.com/result",
	}

	balanceResponse, err := client.AccountBalance(params)
	if err != nil {
		log.Printf("Error fetching M-Pesa account balance: %v", err)
		http.Error(w, "Failed to fetch M-Pesa account balance", http.StatusInternalServerError)
		return
	}

	// Map the M-Pesa response to our generic BalanceResponse
	type BalanceResponse struct {
		Bank     string  `json:"bank"`
		Account  string  `json:"account"`
		Balance  float64 `json:"balance"` // This might need conversion from string in actual response
		Currency string  `json:"currency"`
		Status   string  `json:"status"`
		// Add other relevant fields from M-Pesa response
		RawResponse interface{} `json:"raw_response"` // Include raw response for debugging
	}

	// Assuming M-Pesa's AccountBalanceResponse has fields like Result.ResultParameters.ResultParameter for balance
	// This mapping will be highly dependent on the actual structure of the M-Pesa API response.
	// For now, let's use a placeholder if we don't have the exact response struct.
	var currentBalance float64 = 0.0 // Placeholder
	var currency string = "KES"      // Placeholder
	
	// A more robust implementation would parse balanceResponse to extract actual data.
	// Example (highly dependent on actual daraja.AccountBalanceResponse structure):
	// if balanceResponse != nil && balanceResponse.Result != nil && len(balanceResponse.Result.ResultParameters.ResultParameter) > 0 {
	// 	for _, param := range balanceResponse.Result.ResultParameters.ResultParameter {
	// 		if param.Key == "AccountBalance" {
	// 			currentBalance, _ = strconv.ParseFloat(param.Value, 64)
	// 		}
	// 		// Find currency if available
	// 	}
	// }

	response := BalanceResponse{
		Bank:        "Mpesa",
		Account:     fmt.Sprintf("%d", params.PartyA), // Using PartyA as account identifier for now
		Balance:     currentBalance,
		Currency:    currency,
		Status:      "Success", // Or map from balanceResponse status
		RawResponse: balanceResponse,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}




