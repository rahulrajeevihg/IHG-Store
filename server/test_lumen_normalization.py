import unittest

from server.lumen_normalization import build_lumen_overlap_filter, parse_lumen


class LumenParserTests(unittest.TestCase):
    def test_single_value(self):
        result = parse_lumen("3680lm")
        self.assertEqual(result["min"], 3680.0)
        self.assertEqual(result["max"], 3680.0)
        self.assertEqual(result["unit"], "lm")

    def test_range(self):
        result = parse_lumen("700-800lm/m")
        self.assertEqual(result["min"], 700.0)
        self.assertEqual(result["max"], 800.0)
        self.assertEqual(result["unit"], "lm/m")

    def test_ratio_unit(self):
        result = parse_lumen("65lm/W")
        self.assertEqual(result["min"], 65.0)
        self.assertEqual(result["max"], 65.0)
        self.assertEqual(result["unit"], "lm/w")

    def test_slash_values(self):
        result = parse_lumen("2120lm/2960lm")
        self.assertEqual(result["values"], [2120.0, 2960.0])
        self.assertEqual(result["min"], 2120.0)
        self.assertEqual(result["max"], 2960.0)

    def test_multiplication(self):
        self.assertEqual(parse_lumen("2x700lm")["min"], 1400.0)
        self.assertEqual(parse_lumen("1204×2lm")["max"], 2408.0)
        self.assertEqual(parse_lumen("2×297lm")["min"], 594.0)

    def test_rgb_channels(self):
        result = parse_lumen("R(91lm), G(281lm), B(50lm)")
        self.assertEqual(result["values"], [91.0, 281.0, 50.0])
        self.assertEqual(result["min"], 50.0)
        self.assertEqual(result["max"], 281.0)

    def test_up_down(self):
        result = parse_lumen("U1000lm/D2000lm")
        self.assertEqual(result["values"], [1000.0, 2000.0])
        self.assertEqual(result["min"], 1000.0)
        self.assertEqual(result["max"], 2000.0)

    def test_comma_values(self):
        result = parse_lumen("800lm,350lm")
        self.assertEqual(result["values"], [800.0, 350.0])
        self.assertEqual(result["min"], 350.0)
        self.assertEqual(result["max"], 800.0)

    def test_thousands_separator(self):
        result = parse_lumen("3,800lm")
        self.assertEqual(result["min"], 3800.0)
        self.assertEqual(result["max"], 3800.0)

    def test_invalid(self):
        self.assertEqual(parse_lumen("NA")["status"], "invalid")
        self.assertEqual(parse_lumen("")["status"], "invalid")
        self.assertEqual(parse_lumen(None)["status"], "invalid")

    def test_overlap_filter(self):
        clause = build_lumen_overlap_filter("lm/w", 60, 75)
        self.assertEqual(clause, '(lumen_unit:="lm/w" && lumen_min:<=75.0 && lumen_max:>=60.0)')


if __name__ == "__main__":
    unittest.main()
