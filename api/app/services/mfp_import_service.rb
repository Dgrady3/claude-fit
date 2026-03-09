require "csv"
require "zip"

class MfpImportService
  # MFP Premium export column mappings (may vary slightly)
  COLUMN_MAP = {
    "Date" => :date,
    "Meal Name" => :meal_name,
    "Meal" => :meal_name,
    "Calories" => :calories,
    "Protein (g)" => :protein_g,
    "Carbohydrates (g)" => :carbs_g,
    "Carbs (g)" => :carbs_g,
    "Total Carbohydrates (g)" => :carbs_g,
    "Fat (g)" => :fat_g,
    "Total Fat (g)" => :fat_g,
    "Fiber (g)" => :fiber_g,
    "Sugar (g)" => :sugar_g,
    "Sodium (mg)" => :sodium_mg,
    "Saturated Fat (g)" => :saturated_fat_g,
    "Cholesterol (mg)" => :cholesterol_mg,
    "Food Name" => :food_name,
    "Name" => :food_name
  }.freeze

  def call(user, uploaded_file)
    csv_path = extract_nutrition_csv(uploaded_file)
    import_csv(user, csv_path)
  ensure
    # Clean up temp extracted file if we created one
    File.delete(csv_path) if csv_path && csv_path != uploaded_file.path && File.exist?(csv_path)
  end

  private

  def extract_nutrition_csv(uploaded_file)
    if uploaded_file.original_filename&.end_with?(".zip")
      extract_from_zip(uploaded_file.path)
    else
      uploaded_file.path
    end
  end

  def extract_from_zip(zip_path)
    temp_path = nil

    Zip::File.open(zip_path) do |zip|
      # Look for the nutrition CSV — MFP names vary
      nutrition_entry = zip.entries.find do |e|
        name = e.name.downcase
        name.include?("nutrition") || name.include?("food") || name.include?("meal")
      end

      # Fallback: first CSV that isn't exercise or measurement
      nutrition_entry ||= zip.entries.find do |e|
        name = e.name.downcase
        name.end_with?(".csv") && !name.include?("exercise") && !name.include?("measurement")
      end

      raise "No nutrition CSV found in ZIP" unless nutrition_entry

      temp_path = Rails.root.join("tmp", "mfp_nutrition_#{SecureRandom.hex(8)}.csv").to_s
      nutrition_entry.extract(temp_path)
    end

    temp_path
  end

  def import_csv(user, csv_path)
    imported = 0
    skipped = 0
    errors = []

    CSV.foreach(csv_path, headers: true, liberal_parsing: true) do |row|
      mapped = map_columns(row)
      next if mapped[:date].blank? || mapped[:calories].blank?

      date = parse_date(mapped[:date])
      meal = normalize_meal(mapped[:meal_name])

      # MFP exports meal-level aggregates (no food names)
      # Use meal name as food_name if no specific food name column
      food_name = mapped[:food_name].presence || "#{meal} total"

      # Skip duplicate imports for same date/meal/source
      if user.nutrition_entries.exists?(date: date, meal_name: meal, food_name: food_name, source: "mfp_import")
        skipped += 1
        next
      end

      entry = user.nutrition_entries.new(
        date: date,
        meal_name: meal,
        food_name: food_name,
        calories: mapped[:calories].to_f,
        protein_g: mapped[:protein_g].to_f,
        carbs_g: mapped[:carbs_g].to_f,
        fat_g: mapped[:fat_g].to_f,
        fiber_g: mapped[:fiber_g].to_f,
        sugar_g: mapped[:sugar_g].to_f,
        sodium_mg: mapped[:sodium_mg].to_f,
        source: "mfp_import"
      )

      if entry.save
        imported += 1
      else
        errors << "Row #{imported + skipped + errors.length + 1}: #{entry.errors.full_messages.join(', ')}"
      end
    rescue StandardError => e
      errors << "Row parse error: #{e.message}"
    end

    { imported: imported, skipped: skipped, errors: errors }
  end

  def map_columns(row)
    result = {}
    row.each do |header, value|
      next unless header
      key = COLUMN_MAP[header.strip]
      result[key] = value&.strip if key
    end
    result
  end

  def normalize_meal(meal_str)
    return "Snacks" if meal_str.blank?
    normalized = meal_str.strip.downcase
    case normalized
    when "breakfast" then "Breakfast"
    when "lunch" then "Lunch"
    when "dinner" then "Dinner"
    when "snacks", "snack" then "Snacks"
    else meal_str.strip.titleize
    end
  end

  def parse_date(date_str)
    Date.parse(date_str)
  rescue StandardError
    Date.current
  end
end
