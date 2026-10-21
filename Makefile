.PHONY: clean default geo all

default:
	@echo "Please specify a target to make."
	@echo "Targets: all, clean, data, geo"

all: geo

geo: static/data/cb_2023_us_state_500k.json src/data/cb_2023_us_county_500k.json static/data/cb_2023_us_county_500k_national.json static/data/cb_2021_us_cbsa_500k.json

clean:
	rm -f static/data/cb_2023_us_state_500k.json
	rm -f static/data/cb_2021_us_cbsa_500k.json
	rm -f src/data/cb_2023_us_county_500k.json
	rm -f static/data/cb_2023_us_county_500k_national.json

static/data/cb_2021_us_cbsa_500k.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2021_us_cbsa_500k.zip -L https://www2.census.gov/geo/tiger/GENZ2021/shp/cb_2021_us_cbsa_500k.zip

	# unzip download
	unzip -o data/output/cb_2021_us_cbsa_500k.zip -d data/output/cb_2021_us_cbsa_500k

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2021_us_cbsa_500k/cb_2021_us_cbsa_500k.shp \
		-rename-layers cbsas \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2021_us_cbsa_500k.zip
	rm -rf data/output/cb_2021_us_cbsa_500k

src/data/cb_2023_us_county_500k.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2023_us_county_500k.zip -L https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip

	# unzip download
	unzip -o data/output/cb_2023_us_county_500k.zip -d data/output/cb_2023_us_county_500k

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2023_us_county_500k/cb_2023_us_county_500k.shp \
		-rename-layers counties \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID, state_fips: STATEFP}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2023_us_county_500k.zip
	rm -rf data/output/cb_2023_us_county_500k

# The same counties as src/data/cb_2023_us_county_500k.json, but for the national
# county map on the home and category pages, so it is built to different constraints:
# it ships to the browser whole rather than as one state's worth at a time, and it is
# drawn at ~15px per county instead of filling the frame with one state. Hence
# `visvalingam 3%` instead of 7%, plus a coordinate precision cap; together they take the
# file from 285 KB gzipped to 169 KB. It keeps its own download and unzip paths so it can
# never race the per-state target over a shared file.
#
# mapshaper prints "Ignoring precision=0.01 -- this option only works with
# no-quantization" here. **The warning is wrong** — the option is applied. The output's
# topojson `transform.scale` comes back as 0.00999991, i.e. the 0.01-degree grid asked
# for, and dropping the flag grows the file to 204 KB gzipped. Don't "fix" this by
# removing it.
#
# A coarser `quantization=3000` is ~17 KB smaller again, and was rejected: its ~4.2km
# grid is wider than the smallest counties in the file, which risks collapsing them.
# 0.01 degrees is ~1.1km, sub-pixel at the width this map draws at.
static/data/cb_2023_us_county_500k_national.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2023_us_county_500k_national.zip -L https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip

	# unzip download
	unzip -o data/output/cb_2023_us_county_500k_national.zip -d data/output/cb_2023_us_county_500k_national

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2023_us_county_500k_national/cb_2023_us_county_500k.shp \
		-rename-layers counties \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID}' \
		-clean \
		-simplify visvalingam 3% \
		-o format=topojson precision=0.01 $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2023_us_county_500k_national.zip
	rm -rf data/output/cb_2023_us_county_500k_national

static/data/cb_2023_us_state_500k.json:
	mkdir -p $(dir $@)
	mkdir -p data/output

	# download zipped shapefile
	curl -o data/output/cb_2023_us_state_500k.zip -L https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_state_500k.zip

	# unzip download
	unzip -o data/output/cb_2023_us_state_500k.zip -d data/output/cb_2023_us_state_500k

	# convert shapefile to topojson
	npx mapshaper data/output/cb_2023_us_state_500k/cb_2023_us_state_500k.shp \
		-rename-layers states \
		-filter "parseInt(STATEFP) < 60 || parseInt(STATEFP) == 72" \
		-clip bbox=-180,-90,-48,90 \
		-each 'this.properties = {fips: GEOID}' \
		-clean \
		-simplify visvalingam 7% \
		-o format=topojson $@

	touch $@

	# cleanup extra files
	rm data/output/cb_2023_us_state_500k.zip
	rm -rf data/output/cb_2023_us_state_500k

