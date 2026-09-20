package schemes_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"scheme-backend-go/gen/sqlc"
	delivery "scheme-backend-go/internal/features/schemes/delivery/http"
	"scheme-backend-go/internal/features/schemes/dto"
	"scheme-backend-go/internal/features/schemes/service"
	"scheme-backend-go/internal/pkg/errors"
)

type MockSchemesRepo struct {
	mock.Mock
}

func (m *MockSchemesRepo) ListPublishedSchemes(ctx context.Context) ([]sqlc.Scheme, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) ListAllSchemes(ctx context.Context) ([]sqlc.Scheme, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) GetSchemeByID(ctx context.Context, id int32) (sqlc.Scheme, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) GetSchemeBySlug(ctx context.Context, slug string) (sqlc.Scheme, error) {
	args := m.Called(ctx, slug)
	return args.Get(0).(sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) ListCategories(ctx context.Context) ([]string, error) {
	args := m.Called(ctx)
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockSchemesRepo) ListStates(ctx context.Context) ([]string, error) {
	args := m.Called(ctx)
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockSchemesRepo) GetBenefitsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.Benefit, error) {
	args := m.Called(ctx, schemeID)
	return args.Get(0).([]sqlc.Benefit), args.Error(1)
}

func (m *MockSchemesRepo) GetEligibilityRulesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.EligibilityRule, error) {
	args := m.Called(ctx, schemeID)
	return args.Get(0).([]sqlc.EligibilityRule), args.Error(1)
}

func (m *MockSchemesRepo) GetRequiredDocumentsBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.RequiredDocument, error) {
	args := m.Called(ctx, schemeID)
	return args.Get(0).([]sqlc.RequiredDocument), args.Error(1)
}

func (m *MockSchemesRepo) GetOfficialSourcesBySchemeID(ctx context.Context, schemeID int32) ([]sqlc.OfficialSource, error) {
	args := m.Called(ctx, schemeID)
	return args.Get(0).([]sqlc.OfficialSource), args.Error(1)
}

func (m *MockSchemesRepo) ListAllEligibilityRules(ctx context.Context) ([]sqlc.EligibilityRule, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.EligibilityRule), args.Error(1)
}

func (m *MockSchemesRepo) ListAllBenefitsSummary(ctx context.Context) ([]sqlc.ListAllBenefitsSummaryRow, error) {
	args := m.Called(ctx)
	return args.Get(0).([]sqlc.ListAllBenefitsSummaryRow), args.Error(1)
}

func (m *MockSchemesRepo) CreateScheme(ctx context.Context, arg sqlc.CreateSchemeParams) (sqlc.Scheme, error) {
	args := m.Called(ctx, arg)
	return args.Get(0).(sqlc.Scheme), args.Error(1)
}

func (m *MockSchemesRepo) DeleteScheme(ctx context.Context, id int32) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func TestSchemes_ListAndCategories_Flow(t *testing.T) {
	repo := new(MockSchemesRepo)
	svc := service.NewSchemesService(repo, nil) // no redis in test
	handler := delivery.NewSchemesHandler(svc)

	app := fiber.New(fiber.Config{
		ErrorHandler: errors.FiberErrorHandler,
	})
	handler.RegisterRoutes(app)

	// Mock ListPublishedSchemes
	sampleScheme := sqlc.Scheme{
		ID:               1,
		Name:             "PM Kisan Samman Nidhi",
		Slug:             "pm-kisan",
		State:            "ALL_INDIA",
		Category:         "Agriculture",
		Ministry:         "Ministry of Agriculture",
		Description:      "Income support of Rs. 6000 per year for all landholding farmer families.",
		Status:           "active",
		PublicationState: "published",
		SourceFreshness:  "fresh",
		CreatedAt:        pgtype.Timestamptz{Time: time.Now(), Valid: true},
		UpdatedAt:        pgtype.Timestamptz{Time: time.Now(), Valid: true},
	}

	repo.On("ListPublishedSchemes", mock.Anything).Return([]sqlc.Scheme{sampleScheme}, nil).Once()
	repo.On("GetBenefitsBySchemeID", mock.Anything, int32(1)).Return([]sqlc.Benefit{}, nil).Once()
	repo.On("GetEligibilityRulesBySchemeID", mock.Anything, int32(1)).Return([]sqlc.EligibilityRule{}, nil).Once()
	repo.On("GetRequiredDocumentsBySchemeID", mock.Anything, int32(1)).Return([]sqlc.RequiredDocument{}, nil).Once()
	repo.On("GetOfficialSourcesBySchemeID", mock.Anything, int32(1)).Return([]sqlc.OfficialSource{}, nil).Once()

	// 1. GET /schemes
	req := httptest.NewRequest(http.MethodGet, "/schemes", nil)
	resp, err := app.Test(req, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var paged dto.PaginatedSchemesResponse
	_ = json.NewDecoder(resp.Body).Decode(&paged)
	assert.Equal(t, 1, paged.Total)
	assert.Equal(t, "pm-kisan", paged.Items[0].Slug)

	// 2. GET /schemes/categories
	repo.On("ListCategories", mock.Anything).Return([]string{"Agriculture", "Healthcare", "Education"}, nil).Once()

	req2 := httptest.NewRequest(http.MethodGet, "/schemes/categories", nil)
	resp2, err := app.Test(req2, -1)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, resp2.StatusCode)

	var catResp dto.CategoryListResponse
	_ = json.NewDecoder(resp2.Body).Decode(&catResp)
	assert.Len(t, catResp.Categories, 3)
	assert.Equal(t, "Agriculture", catResp.Categories[0].Category)
}
