package com.example.Book_Fair_Project.service;

import com.example.Book_Fair_Project.model.Exhibition;
import com.example.Book_Fair_Project.repository.ExhibitionRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ExhibitionServiceImpl implements ExhibitionService {

    private final ExhibitionRepository exhibitionRepository;

    public ExhibitionServiceImpl(ExhibitionRepository exhibitionRepository) {
        this.exhibitionRepository = exhibitionRepository;
    }

    @Override
    public List<Exhibition> getAllActiveExhibitions() {
        return exhibitionRepository.findByIsActiveTrue();
    }

    @Override
    public Exhibition getExhibitionById(Long id) {
        return exhibitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Exhibition not found with ID: " + id));
    }

    @Override
    public Exhibition createExhibition(Exhibition exhibition) {
        return exhibitionRepository.save(exhibition);
    }
}
