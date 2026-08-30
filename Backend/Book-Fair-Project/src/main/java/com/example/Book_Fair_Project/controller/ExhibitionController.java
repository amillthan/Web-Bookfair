package com.example.Book_Fair_Project.controller;

import com.example.Book_Fair_Project.dto.common.ApiResponse;
import com.example.Book_Fair_Project.model.Exhibition;
import com.example.Book_Fair_Project.service.ExhibitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exhibitions")
public class ExhibitionController {

    private final ExhibitionService exhibitionService;

    public ExhibitionController(ExhibitionService exhibitionService) {
        this.exhibitionService = exhibitionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Exhibition>>> getAllActiveExhibitions() {
        List<Exhibition> exhibitions = exhibitionService.getAllActiveExhibitions();
        return ResponseEntity.ok(ApiResponse.ok("Active exhibitions retrieved successfully", exhibitions, 200));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Exhibition>> getExhibitionById(@PathVariable Long id) {
        Exhibition exhibition = exhibitionService.getExhibitionById(id);
        return ResponseEntity.ok(ApiResponse.ok("Exhibition retrieved successfully", exhibition, 200));
    }
}
