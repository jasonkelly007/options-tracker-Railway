using Microsoft.AspNetCore.Mvc;
using OptionsTracker.Services;
using OptionsTracker.DTOs;
using OptionsTracker.Models;

namespace OptionsTracker.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OptionsController : ControllerBase
    {
        private readonly IOptionsService _optionsService;

        public OptionsController(IOptionsService optionsService)
        {
            _optionsService = optionsService;
        }

        [HttpGet]
        public async Task<ActionResult<List<OptionsPositionDto>>> GetOptions(
            [FromQuery] string? account = null,
            [FromQuery] string? status = null)
        {
            PositionStatus? statusEnum = null;
            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<PositionStatus>(status, true, out var parsedStatus))
            {
                statusEnum = parsedStatus;
            }

            var options = await _optionsService.GetAllOptionsPositionsAsync(account, statusEnum);
            return Ok(options);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<OptionsPositionDto>> GetOption(int id)
        {
            var option = await _optionsService.GetOptionsPositionByIdAsync(id);
            if (option == null)
                return NotFound();

            return Ok(option);
        }

        [HttpPost("covered-calls")]
        public async Task<ActionResult<OptionsPositionDto>> CreateCoveredCall([FromBody] CreateCoveredCallDto dto)
        {
            try
            {
                var coveredCall = await _optionsService.CreateCoveredCallAsync(dto);
                return CreatedAtAction(nameof(GetOption), new { id = coveredCall.Id }, coveredCall);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("cash-secured-puts")]
        public async Task<ActionResult<OptionsPositionDto>> CreateCashSecuredPut([FromBody] CreateCashSecuredPutDto dto)
        {
            var csp = await _optionsService.CreateCashSecuredPutAsync(dto);
            return CreatedAtAction(nameof(GetOption), new { id = csp.Id }, csp);
        }

        [HttpPost("roll")]
        public async Task<ActionResult<RollHistoryDto>> RollOption([FromBody] RollOptionDto dto)
        {
            try
            {
                var rollHistory = await _optionsService.RollOptionAsync(dto);
                return Ok(rollHistory);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("roll-history")]
        public async Task<ActionResult<List<RollHistoryDto>>> GetRollHistory([FromQuery] int? optionsPositionId = null)
        {
            var history = await _optionsService.GetRollHistoryAsync(optionsPositionId);
            return Ok(history);
        }

        [HttpPost("{id}/close")]
        public async Task<IActionResult> ClosePosition(int id, [FromBody] ClosePositionRequest request)
        {
            var result = await _optionsService.CloseOptionsPositionAsync(id, request.ClosingPrice);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("dashboard")]
        public async Task<ActionResult<DashboardSummaryDto>> GetDashboard([FromQuery] string? account = null)
        {
            var dashboard = await _optionsService.GetDashboardSummaryAsync(account);
            return Ok(dashboard);
        }
    }

    public class ClosePositionRequest
    {
        public decimal ClosingPrice { get; set; }
    }
}
