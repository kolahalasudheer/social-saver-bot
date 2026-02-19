import * as ReelServiceModule from "./reel.service.js";
import * as AIServiceModule from "./ai.service.js";
import * as ScraperServiceModule from "./scraper.service.js";
import * as ReminderServiceModule from "./reminder.service.js";
import * as SearchServiceModule from "./search.service.js";

export const ReelService = ReelServiceModule.ReelService || ReelServiceModule.default;
export const AIService = AIServiceModule.AIService || AIServiceModule.default;
export const ScraperService = ScraperServiceModule.ScraperService || ScraperServiceModule.default;
export const ReminderService = ReminderServiceModule.ReminderService || ReminderServiceModule.default;
export const SearchService = SearchServiceModule.SearchService || SearchServiceModule.default;
