from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="ALL_INDIA", server_default="ALL_INDIA", nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), default="General", server_default="General", nullable=False, index=True)
    tags: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ministry: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", server_default="active", nullable=False, index=True)
    publication_state: Mapped[str] = mapped_column(String(50), default="published", server_default="published", nullable=False, index=True)
    source_freshness: Mapped[str] = mapped_column(String(50), default="fresh", server_default="fresh", nullable=False, index=True)
    application_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    official_website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    launch_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    benefits: Mapped[list["Benefit"]] = relationship(
        "Benefit", back_populates="scheme", cascade="all, delete-orphan", lazy="selectin"
    )
    eligibility_rules: Mapped[list["EligibilityRule"]] = relationship(
        "EligibilityRule", back_populates="scheme", cascade="all, delete-orphan", lazy="selectin"
    )
    required_documents: Mapped[list["RequiredDocument"]] = relationship(
        "RequiredDocument", back_populates="scheme", cascade="all, delete-orphan", lazy="selectin"
    )
    official_sources: Mapped[list["OfficialSource"]] = relationship(
        "OfficialSource", back_populates="scheme", cascade="all, delete-orphan", lazy="selectin"
    )
    versions: Mapped[list["SchemeVersion"]] = relationship(
        "SchemeVersion", back_populates="scheme", cascade="all, delete-orphan"
    )


class Benefit(Base):
    __tablename__ = "benefits"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="benefits")


class EligibilityRule(Base):
    __tablename__ = "eligibility_rules"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    operator: Mapped[str] = mapped_column(String(20), nullable=False)
    rule_value: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="eligibility_rules")


class RequiredDocument(Base):
    __tablename__ = "required_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    document_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(default=True, server_default="true", nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="required_documents")


class OfficialSource(Base):
    __tablename__ = "official_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), default="website", server_default="website", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="official_sources")


class SchemeVersion(Base):
    __tablename__ = "scheme_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_id: Mapped[int] = mapped_column(ForeignKey("schemes.id", ondelete="CASCADE"), index=True, nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    source_hash: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    scheme: Mapped["Scheme"] = relationship("Scheme", back_populates="versions")
    rule_versions: Mapped[list["EligibilityRuleVersion"]] = relationship(
        "EligibilityRuleVersion", back_populates="scheme_version", cascade="all, delete-orphan", lazy="selectin"
    )


class EligibilityRuleVersion(Base):
    __tablename__ = "eligibility_rule_versions"

    id: Mapped[int] = mapped_column(primary_key=True)
    scheme_version_id: Mapped[int] = mapped_column(ForeignKey("scheme_versions.id", ondelete="CASCADE"), index=True, nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    operator: Mapped[str] = mapped_column(String(20), nullable=False)
    rule_value: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    scheme_version: Mapped["SchemeVersion"] = relationship("SchemeVersion", back_populates="rule_versions")


class CanonicalDocument(Base):
    __tablename__ = "canonical_documents"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    schemes_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    issuing_authorities: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

