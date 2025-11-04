package repositoryevent

import (
	"fmt"
	domainevent "safety-riding/internal/domain/event"
	interfaceevent "safety-riding/internal/interfaces/event"
	"safety-riding/pkg/filter"

	"gorm.io/gorm"
)

type repo struct {
	DB *gorm.DB
}

func NewEventRepo(db *gorm.DB) interfaceevent.RepoEventInterface {
	return &repo{
		DB: db,
	}
}

func (r *repo) Create(event domainevent.Event) error {
	return r.DB.Create(&event).Error
}

func (r *repo) GetByID(id string) (domainevent.Event, error) {
	var event domainevent.Event
	err := r.DB.Preload("Photos").Preload("School").Where("id = ?", id).First(&event).Error
	return event, err
}

func (r *repo) Update(event domainevent.Event) error {
	return r.DB.Save(&event).Error
}

func (r *repo) Fetch(params filter.BaseParams) (ret []domainevent.Event, totalData int64, err error) {
	query := r.DB.Model(&domainevent.Event{}).
		Preload("Photos").
		Preload("School").Debug()

	if len(params.Columns) > 0 {
		query = query.Select(params.Columns)
	}

	if params.Search != "" {
		query = query.Where("LOWER(title) LIKE LOWER(?) OR LOWER(instructor_name) LIKE LOWER(?)", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	// apply filters
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
			"event_date":      true,
			"title":           true,
			"status":          true,
			"attendees_count": true,
			"instructor_name": true,
			"event_type":      true,
			"created_at":      true,
			"updated_at":      true,
		}

		if _, ok := validColumns[params.OrderBy]; !ok {
			return nil, 0, fmt.Errorf("invalid orderBy column: %s", params.OrderBy)
		}

		query = query.Order(fmt.Sprintf("%s %s", params.OrderBy, params.OrderDirection))
	}

	if err := query.Offset(params.Offset).Limit(params.Limit).Find(&ret).Error; err != nil {
		return nil, 0, err
	}

	return ret, totalData, nil
}

func (r *repo) Delete(id string) error {
	return r.DB.Where("id = ?", id).Delete(&domainevent.Event{}).Error
}

// Event Photo methods
func (r *repo) AddPhotos(photos []domainevent.EventPhoto) error {
	if len(photos) == 0 {
		return nil
	}
	return r.DB.Create(&photos).Error
}

func (r *repo) GetPhotosByEventID(eventId string) ([]domainevent.EventPhoto, error) {
	var photos []domainevent.EventPhoto
	err := r.DB.Where("event_id = ?", eventId).Order("photo_order ASC").Find(&photos).Error
	return photos, err
}

func (r *repo) GetPhotoByID(photoId string) (domainevent.EventPhoto, error) {
	var photo domainevent.EventPhoto
	err := r.DB.Where("id = ?", photoId).First(&photo).Error
	return photo, err
}

func (r *repo) DeletePhoto(photoId string) error {
	return r.DB.Where("id = ?", photoId).Delete(&domainevent.EventPhoto{}).Error
}

func (r *repo) DeletePhotosByEventID(eventId string) error {
	return r.DB.Where("event_id = ?", eventId).Delete(&domainevent.EventPhoto{}).Error
}
