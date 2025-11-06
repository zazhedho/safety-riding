package utils

import (
	"fmt"
	domainevent "safety-riding/internal/domain/event"
	"safety-riding/internal/dto"
	"strings"
	"time"
)

func UpdateStatus(userId, status string) map[string]interface{} {
	return map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
		"updated_by": userId,
	}
}

func ValidateOnTheSpotSales(items []dto.OnTheSpotSaleItem) error {
	for idx, sale := range items {
		if sale.VehicleType == "" {
			return fmt.Errorf("on_the_spot_sales[%d].vehicle_type is required", idx)
		}

		if err := ValidateNonNegative(sale.Quantity, fmt.Sprintf("on_the_spot_sales[%d].quantity", idx)); err != nil {
			return err
		}

		method := strings.ToLower(sale.PaymentMethod)
		if method == "" {
			return fmt.Errorf("on_the_spot_sales[%d].payment_method is required", idx)
		}
		if method != "cash" && method != "credit" {
			return fmt.Errorf("on_the_spot_sales[%d].payment_method must be either 'cash' or 'credit'", idx)
		}
	}
	return nil
}

func BuildOnTheSpotSales(eventId, username string, items []dto.OnTheSpotSaleItem) []domainevent.EventOnTheSpotSale {
	if len(items) == 0 {
		return nil
	}

	now := time.Now()
	sales := make([]domainevent.EventOnTheSpotSale, 0, len(items))
	for _, item := range items {
		sales = append(sales, domainevent.EventOnTheSpotSale{
			ID:            CreateUUID(),
			EventId:       eventId,
			VehicleType:   TitleCase(item.VehicleType),
			PaymentMethod: strings.ToLower(item.PaymentMethod),
			Quantity:      item.Quantity,
			CreatedAt:     now,
			CreatedBy:     username,
			UpdatedAt:     now,
			UpdatedBy:     username,
		})
	}
	return sales
}
