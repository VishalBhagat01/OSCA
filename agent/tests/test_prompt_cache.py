import unittest
from llm.cache import BoundedInMemoryCache, init_llm_cache, clear_llm_cache


class TestPromptCache(unittest.TestCase):

    def setUp(self):
        clear_llm_cache()

    def test_cache_set_and_lookup(self):
        cache = BoundedInMemoryCache(max_entries=10)
        cache.update("test_prompt", "llm_string", [{"text": "response_content"}])

        hit = cache.lookup("test_prompt", "llm_string")
        self.assertIsNotNone(hit)
        self.assertEqual(hit, [{"text": "response_content"}])

    def test_cache_miss(self):
        cache = BoundedInMemoryCache(max_entries=10)
        miss = cache.lookup("unknown_prompt", "llm_string")
        self.assertIsNone(miss)

    def test_cache_capacity_eviction(self):
        cache = BoundedInMemoryCache(max_entries=3)
        cache.update("p1", "llm", [{"text": "r1"}])
        cache.update("p2", "llm", [{"text": "r2"}])
        cache.update("p3", "llm", [{"text": "r3"}])

        self.assertEqual(len(cache._cache), 3)

        # Adding 4th should evict the oldest entry (p1)
        cache.update("p4", "llm", [{"text": "r4"}])
        self.assertEqual(len(cache._cache), 3)
        self.assertIsNone(cache.lookup("p1", "llm"))
        self.assertIsNotNone(cache.lookup("p4", "llm"))

    def test_init_and_clear_cache(self):
        cache = init_llm_cache(max_entries=50)
        self.assertIsNotNone(cache)
        cache.update("sample", "llm", [{"text": "val"}])
        self.assertIsNotNone(cache.lookup("sample", "llm"))

        clear_llm_cache()
        self.assertIsNone(cache.lookup("sample", "llm"))


if __name__ == "__main__":
    unittest.main()
