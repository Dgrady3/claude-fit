module Api
  module V1
    class DailyReportsController < BaseController
      def index
        reports = current_user.daily_reports
        reports = reports.where(report_type: params[:type]) if params[:type].present?
        reports = reports.recent

        render_json(DailyReportSerializer, reports)
      end

      def show
        report = current_user.daily_reports.find(params[:id])
        render_json(DailyReportSerializer, report)
      end

      def generate
        date = params[:date] ? Date.parse(params[:date]) : Date.current
        report = DailyAnalysisService.new.call(current_user, date)

        if report.persisted?
          render_json(DailyReportSerializer, report, status: :created)
        else
          render_errors(report.errors.full_messages)
        end
      rescue StandardError => e
        render_error("Failed to generate report: #{e.message}", status: :internal_server_error)
      end

      def generate_weekly
        week_ending = params[:date] ? Date.parse(params[:date]) : Date.current
        report = WeeklyAnalysisService.new.call(current_user, week_ending)

        if report.persisted?
          render_json(DailyReportSerializer, report, status: :created)
        else
          render_errors(report.errors.full_messages)
        end
      rescue StandardError => e
        render_error("Failed to generate weekly report: #{e.message}", status: :internal_server_error)
      end
    end
  end
end
