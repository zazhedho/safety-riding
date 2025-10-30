package workorder

import (
	"fmt"
	"workshop-management/internal/domain/workorder"
	"workshop-management/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewWorkOrderRepo(db *gorm.DB) workorder.RepoWorkOrder {
	return &repo{DB: db}
}

func (r *repo) Create(workOrder workorder.WorkOrder, svcWorkOrders []workorder.SvcWorkOrder) error {
	tx := r.DB.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	if err := tx.Omit("Services").Create(&workOrder).Error; err != nil {
		tx.Rollback()
		return err
	}

	if len(svcWorkOrders) > 0 {
		if err := tx.Create(&svcWorkOrders).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit().Error
}

func (r *repo) GetById(id string) (workorder.WorkOrder, error) {
	var wo workorder.WorkOrder
	if err := r.DB.Where("id = ?", id).First(&wo).Error; err != nil {
		return workorder.WorkOrder{}, err
	}

	return wo, nil
}

func (r *repo) Update(m workorder.WorkOrder, data map[string]interface{}) (int64, error) {
	res := r.DB.Model(&m).Where("id = ?", m.Id).Updates(data)
	if res.Error != nil {
		return 0, res.Error
	}

	return res.RowsAffected, nil
}

func (r *repo) Fetch(params filter.BaseParams) (ret []workorder.WorkOrder, totalData int64, err error) {
	query := r.DB.Model(&workorder.WorkOrder{}).Preload("Services", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, work_order_id, service_id, service_name, price, quantity")
	}).Preload("User", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, name, email, phone")
	}).Preload("Vehicle", func(db *gorm.DB) *gorm.DB {
		return db.Select("id, model, license_plate")
	})

	if params.Search != "" {
		query = query.Where("LOWER(notes) LIKE LOWER(?) OR LOWER(status) LIKE LOWER(?)", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	for key, value := range params.Filters {
		if value == nil {
			continue
		}

		switch v := value.(type) {
		case string:
			if v == "" {
				continue
			}
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		case []string, []int:
			query = query.Where(fmt.Sprintf("%s IN ?", key), v)
		default:
			query = query.Where(fmt.Sprintf("%s = ?", key), v)
		}
	}

	if err = query.Count(&totalData).Error; err != nil {
		return nil, 0, err
	}

	if params.OrderBy != "" && params.OrderDirection != "" {
		validColumns := map[string]bool{
			"booking_date": true,
			"status":       true,
			"created_at":   true,
			"updated_at":   true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err = query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}
