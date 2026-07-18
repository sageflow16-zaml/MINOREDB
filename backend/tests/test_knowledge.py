"""Tests for the Institutional Knowledge Library V2."""
from uuid import uuid4
from src.schemas.knowledge import (
    KnowledgeCategoryCreate, KnowledgeTagCreate,
    KnowledgeConceptCreate, KnowledgeRelationshipCreate,
    KnowledgeExampleCreate, KnowledgeReferenceCreate,
    KnowledgeSourceCreate, KnowledgeRevisionCreate,
)
from src.crud import knowledge as crud
from src.services.knowledge_library import (
    get_institutional_concepts, get_institutional_relationships,
    get_institutional_examples, search_institutional_knowledge,
    get_institutional_knowledge_summary, get_institutional_knowledge,
)


def _slug(prefix):
    return f"{prefix}-{uuid4().hex[:8]}"


class TestKnowledgeCRUD:

    def test_create_category(self, db):
        s = _slug("ict")
        c = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=s, slug=s, description="Inner Circle Trader concepts"))
        assert c.id
        assert c.name == s
        assert c.slug == s

    def test_create_and_read_category(self, db):
        s = _slug("ms")
        c = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=s, slug=s))
        got = crud.get_category(db, c.id)
        assert got.id == c.id
        assert got.name == s

    def test_get_categories(self, db):
        crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=_slug("a"), slug=_slug("a"), sort_order=1))
        crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=_slug("b"), slug=_slug("b"), sort_order=2))
        cats = crud.get_categories(db)
        assert len(cats) >= 2

    def test_update_category(self, db):
        s = _slug("old")
        c = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=s, slug=s))
        from src.schemas.knowledge import KnowledgeCategoryUpdate
        updated = crud.update_category(db, db_obj=c, obj_in=KnowledgeCategoryUpdate(name=s + "_new"))
        assert updated.name == s + "_new"

    def test_delete_category(self, db):
        s = _slug("del")
        c = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=s, slug=s))
        crud.remove_category(db, id=c.id)
        assert crud.get_category(db, c.id) is None

    def test_create_tag(self, db):
        t = crud.create_tag(db, obj_in=KnowledgeTagCreate(name=_slug("tag"), color="#ff0000"))
        assert t.id

    def test_get_tags(self, db):
        crud.create_tag(db, obj_in=KnowledgeTagCreate(name=_slug("ta")))
        crud.create_tag(db, obj_in=KnowledgeTagCreate(name=_slug("tb")))
        tags = crud.get_tags(db)
        assert len(tags) >= 2

    def test_delete_tag(self, db):
        t = crud.create_tag(db, obj_in=KnowledgeTagCreate(name=_slug("dt")))
        crud.remove_tag(db, id=t.id)
        assert crud.get_tag(db, t.id) is None


class TestKnowledgeConceptCRUD:
    def _setup(self, db):
        self.cat_slug = _slug("tc")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=self.cat_slug, slug=self.cat_slug))
        self.tag = crud.create_tag(db, obj_in=KnowledgeTagCreate(name=_slug("tg1")))

    def test_create_concept(self, db):
        self._setup(db)
        cs = _slug("ob")
        c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(
            category_id=self.cat.id, title="Order Block", slug=cs,
            summary="An order block is a consolidation zone", definition="Detailed definition here",
            tag_ids=[self.tag.id],
        ))
        assert c.id
        assert len(c.tags) == 1
        assert c.status == "draft"

    def test_get_concept_with_relations(self, db):
        self._setup(db)
        cs = _slug("fvg")
        c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="FVG", slug=cs))
        got = crud.get_concept(db, c.id)
        assert got.title == "FVG"

    def test_get_concepts(self, db):
        self._setup(db)
        crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="C1", slug=_slug("c1")))
        crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="C2", slug=_slug("c2")))
        concepts = crud.get_concepts(db, category_id=self.cat.id)
        assert len(concepts) >= 2

    def test_update_concept(self, db):
        self._setup(db)
        cs = _slug("cu")
        c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="Old", slug=cs))
        from src.schemas.knowledge import KnowledgeConceptUpdate
        updated = crud.update_concept(db, db_obj=c, obj_in=KnowledgeConceptUpdate(title="New", status="published", reviewed=True))
        assert updated.title == "New"
        assert updated.status == "published"

    def test_delete_concept(self, db):
        self._setup(db)
        cs = _slug("dc")
        c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="Del", slug=cs))
        crud.remove_concept(db, id=c.id)
        assert crud.get_concept(db, c.id) is None

    def test_concept_slug_unique_per_category(self, db):
        self._setup(db)
        cs = _slug("dup")
        crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="X", slug=cs))
        import pytest
        from sqlalchemy.exc import IntegrityError
        with pytest.raises(IntegrityError):
            crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="X2", slug=cs))
            db.commit()

    def test_sync_tags(self, db):
        self._setup(db)
        cs = _slug("st")
        tag2 = crud.create_tag(db, obj_in=KnowledgeTagCreate(name=_slug("tg2")))
        c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(
            category_id=self.cat.id, title="TagTest", slug=cs, tag_ids=[self.tag.id],
        ))
        assert len(c.tags) == 1
        updated = crud.update_concept(db, db_obj=c, obj_in=KnowledgeConceptCreate(
            category_id=self.cat.id, title="TagTest", slug=cs, tag_ids=[tag2.id],
        ))
        assert len(updated.tags) == 1
        assert updated.tags[0].name == tag2.name


class TestKnowledgeRelationships:

    def _setup(self, db):
        cs = _slug("r")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=cs, slug=cs))
        self.c1 = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="C1", slug=_slug("c1")))
        self.c2 = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="C2", slug=_slug("c2")))

    def test_create_relationship(self, db):
        self._setup(db)
        r = crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
            source_concept_id=self.c1.id, target_concept_id=self.c2.id,
            relationship_type="prerequisite", strength=0.8, confidence=0.9,
        ))
        assert r.id
        assert r.relationship_type == "prerequisite"

    def test_get_relationships(self, db):
        self._setup(db)
        crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
            source_concept_id=self.c1.id, target_concept_id=self.c2.id,
            relationship_type="supports",
        ))
        rels = crud.get_relationships(db)
        assert len(rels) >= 1

    def test_get_relationships_by_concept(self, db):
        self._setup(db)
        crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
            source_concept_id=self.c1.id, target_concept_id=self.c2.id,
            relationship_type="depends_on",
        ))
        rels = crud.get_relationships(db, concept_id=self.c1.id)
        assert len(rels) >= 1

    def test_delete_relationship(self, db):
        self._setup(db)
        r = crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
            source_concept_id=self.c1.id, target_concept_id=self.c2.id,
            relationship_type="invalidates",
        ))
        crud.remove_relationship(db, id=r.id)
        assert crud.get_relationship(db, r.id) is None

    def test_relationship_unique_constraint(self, db):
        self._setup(db)
        crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
            source_concept_id=self.c1.id, target_concept_id=self.c2.id,
            relationship_type="related_to",
        ))
        import pytest
        from sqlalchemy.exc import IntegrityError
        with pytest.raises(IntegrityError):
            crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
                source_concept_id=self.c1.id, target_concept_id=self.c2.id,
                relationship_type="related_to",
            ))
            db.commit()


class TestKnowledgeExamples:

    def _setup(self, db):
        cs = _slug("e")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=cs, slug=cs))
        self.c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="EC", slug=_slug("ec")))

    def test_create_example(self, db):
        self._setup(db)
        e = crud.create_example(db, obj_in=KnowledgeExampleCreate(
            concept_id=self.c.id, title="Bullish FVG", pair="EURUSD", timeframe="1h",
        ))
        assert e.id
        assert e.pair == "EURUSD"

    def test_get_examples_by_concept(self, db):
        self._setup(db)
        crud.create_example(db, obj_in=KnowledgeExampleCreate(concept_id=self.c.id, title="Ex1"))
        crud.create_example(db, obj_in=KnowledgeExampleCreate(concept_id=self.c.id, title="Ex2"))
        examples = crud.get_examples(db, concept_id=self.c.id)
        assert len(examples) >= 2

    def test_delete_example(self, db):
        self._setup(db)
        e = crud.create_example(db, obj_in=KnowledgeExampleCreate(concept_id=self.c.id, title="Del"))
        crud.remove_example(db, id=e.id)
        assert crud.get_example(db, e.id) is None


class TestKnowledgeReferences:

    def _setup(self, db):
        cs = _slug("ref")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=cs, slug=cs))
        self.c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="RC", slug=_slug("rc")))

    def test_create_reference(self, db):
        self._setup(db)
        r = crud.create_reference(db, obj_in=KnowledgeReferenceCreate(
            concept_id=self.c.id, source_type="book", title="Trading in the Zone", author="Mark Douglas",
        ))
        assert r.id

    def test_get_references(self, db):
        self._setup(db)
        crud.create_reference(db, obj_in=KnowledgeReferenceCreate(concept_id=self.c.id, source_type="article", title="Ref1"))
        refs = crud.get_references(db)
        assert len(refs) >= 1

    def test_delete_reference(self, db):
        self._setup(db)
        r = crud.create_reference(db, obj_in=KnowledgeReferenceCreate(concept_id=self.c.id, source_type="video", title="Del"))
        crud.remove_reference(db, id=r.id)
        assert crud.get_reference(db, r.id) is None


class TestKnowledgeSources:

    def test_create_source(self, db):
        s = crud.create_source(db, obj_in=KnowledgeSourceCreate(name="test.pdf", type="pdf"))
        assert s.id
        assert s.status == "pending"

    def test_get_sources(self, db):
        crud.create_source(db, obj_in=KnowledgeSourceCreate(name="s1.pdf", type="pdf"))
        crud.create_source(db, obj_in=KnowledgeSourceCreate(name="s2.pdf", type="pdf"))
        sources = crud.get_sources(db)
        assert len(sources) >= 2

    def test_update_source(self, db):
        s = crud.create_source(db, obj_in=KnowledgeSourceCreate(name="s.pdf", type="pdf"))
        from src.schemas.knowledge import KnowledgeSourceUpdate
        updated = crud.update_source(db, db_obj=s, obj_in=KnowledgeSourceUpdate(status="completed"))
        assert updated.status == "completed"


class TestKnowledgeSearch:

    def _setup(self, db):
        cs = _slug("s")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=cs, slug=cs))
        self.c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(
            category_id=self.cat.id, title="Liquidity Sweep", slug=_slug("ls"),
            summary="A liquidity sweep occurs when price moves to take out resting orders",
            status="published",
        ))

    def test_search_by_title(self, db):
        self._setup(db)
        results = search_institutional_knowledge(db, "liquidity")
        assert len(results) >= 1
        assert any("Liquidity" in r["title"] for r in results)

    def test_search_by_summary(self, db):
        self._setup(db)
        results = search_institutional_knowledge(db, "resting orders")
        assert len(results) >= 1

    def test_search_empty(self, db):
        results = search_institutional_knowledge(db, "zzzzzxyzzy")
        assert len(results) == 0

    def test_get_institutional_concepts(self, db):
        self._setup(db)
        concepts = get_institutional_concepts(db)
        assert len(concepts) >= 1

    def test_get_institutional_summary(self, db):
        self._setup(db)
        summary = get_institutional_knowledge_summary(db)
        assert summary["total_concepts"] >= 1
        assert len(summary["categories"]) >= 1


class TestKnowledgeRelationshipsIntegration:

    def _setup(self, db):
        cs = _slug("i")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=cs, slug=cs))
        self.c1 = crud.create_concept(db, obj_in=KnowledgeConceptCreate(
            category_id=self.cat.id, title="Breaker Block", slug=_slug("bb"), status="published",
        ))
        self.c2 = crud.create_concept(db, obj_in=KnowledgeConceptCreate(
            category_id=self.cat.id, title="Mitigation Block", slug=_slug("mb"), status="published",
        ))
        self.r = crud.create_relationship(db, obj_in=KnowledgeRelationshipCreate(
            source_concept_id=self.c1.id, target_concept_id=self.c2.id,
            relationship_type="related_to", strength=0.7, confidence=0.8,
        ))

    def test_get_related_concepts(self, db):
        self._setup(db)
        related = crud.get_related_concepts(db, self.c1.id)
        assert len(related) >= 1

    def test_get_explorer_data(self, db):
        self._setup(db)
        nodes, edges = crud.get_explorer_data(db)
        assert len(nodes) >= 2
        assert len(edges) >= 1

    def test_get_explorer_filtered(self, db):
        self._setup(db)
        nodes, edges = crud.get_explorer_data(db, concept_id=self.c1.id)
        assert len(nodes) >= 1

    def test_get_institutional_relationships(self, db):
        self._setup(db)
        rels = get_institutional_relationships(db)
        assert len(rels) >= 1


class TestKnowledgeRevisions:

    def _setup(self, db):
        cs = _slug("v")
        self.cat = crud.create_category(db, obj_in=KnowledgeCategoryCreate(name=cs, slug=cs))
        self.c = crud.create_concept(db, obj_in=KnowledgeConceptCreate(category_id=self.cat.id, title="Rev", slug=_slug("rev")))

    def test_create_revision(self, db):
        self._setup(db)
        rev = crud.create_revision(db, obj_in=KnowledgeRevisionCreate(
            concept_id=self.c.id, version=1, changes={"title": {"old": "Old", "new": "Rev"}},
        ))
        assert rev.id
        assert rev.version == 1

    def test_get_revisions(self, db):
        self._setup(db)
        crud.create_revision(db, obj_in=KnowledgeRevisionCreate(concept_id=self.c.id, version=1))
        crud.create_revision(db, obj_in=KnowledgeRevisionCreate(concept_id=self.c.id, version=2))
        revs = crud.get_revisions(db, concept_id=self.c.id)
        assert len(revs) >= 2

    def test_get_revisions_all(self, db):
        self._setup(db)
        crud.create_revision(db, obj_in=KnowledgeRevisionCreate(concept_id=self.c.id, version=1))
        revs = crud.get_revisions(db)
        assert len(revs) >= 1


class TestGetInstitutionalKnowledge:

    def test_get_institutional_knowledge_empty(self, db):
        result = get_institutional_knowledge(db, uuid4(), None)
        assert "results" in result
        assert "relationships" in result
        assert "examples" in result
        assert "summary" in result

    def test_get_institutional_knowledge_with_question(self, db):
        result = get_institutional_knowledge(db, uuid4(), "test")
        assert isinstance(result, dict)
